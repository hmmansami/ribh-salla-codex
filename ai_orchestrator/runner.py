#!/usr/bin/env python3
from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import textwrap
import urllib.error
import urllib.request
from typing import Any


DEFAULT_MODEL = "gpt-4.1"
DEFAULT_API_BASE_URL = "https://api.openai.com/v1"
DEFAULT_MAX_SLICES = 6
DEFAULT_MAX_ATTEMPTS_PER_SLICE = 3
DEFAULT_MAX_FILES_PER_SLICE = 8
DEFAULT_COMMAND_TIMEOUT_SECONDS = 1200
RUNS_DIR = ".ai_orchestrator/runs"
MAX_FILE_CHARS = 25_000
MAX_REPO_FILES = 600
DEFAULT_CODEX_REASONING_EFFORT = "low"


class OrchestratorError(RuntimeError):
    pass


@dataclasses.dataclass
class SlicePlan:
    id: str
    title: str
    objective: str
    acceptance: list[str]
    check_commands: list[str]
    files_hint: list[str]


@dataclasses.dataclass
class Spec:
    goal: str
    constraints: list[str]
    acceptance_criteria: list[str]
    check_commands: list[str]
    model_backend: str
    model: str
    api_base_url: str
    max_slices: int
    max_attempts_per_slice: int
    max_files_per_slice: int
    command_timeout_seconds: int
    working_directory: Path
    context_files: list[str]
    planner_notes: str
    implementer_notes: str
    reviewer_notes: str


def spec_to_payload(spec: Spec) -> dict[str, Any]:
    payload = dataclasses.asdict(spec)
    payload["working_directory"] = str(spec.working_directory)
    return payload


@dataclasses.dataclass
class CheckResult:
    command: str
    exit_code: int
    output: str

    @property
    def passed(self) -> bool:
        return self.exit_code == 0


@dataclasses.dataclass
class ReviewResult:
    passed: bool
    issues: list[str]
    required_fixes: list[str]
    raw_output: str


class RunLogger:
    def __init__(self, run_dir: Path):
        self.run_dir = run_dir
        self.run_dir.mkdir(parents=True, exist_ok=True)

    def write_text(self, relative_path: str, content: str) -> None:
        target = self.run_dir / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def write_json(self, relative_path: str, payload: Any) -> None:
        self.write_text(relative_path, json.dumps(payload, indent=2, ensure_ascii=False))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="AI orchestrator that decomposes a goal into slices and enforces checks per slice."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    plan_parser = subparsers.add_parser("plan", help="Generate and print the slice plan only.")
    plan_parser.add_argument("--spec", required=True, help="Path to the JSON spec file.")

    run_parser = subparsers.add_parser("run", help="Plan, implement, test, and review each slice.")
    run_parser.add_argument("--spec", required=True, help="Path to the JSON spec file.")
    run_parser.add_argument(
        "--continue-on-failure",
        action="store_true",
        help="Continue to next slice even if current slice fails all attempts.",
    )

    return parser.parse_args()


def now_stamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def load_spec(path: Path) -> Spec:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise OrchestratorError(f"Spec file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise OrchestratorError(f"Spec file is not valid JSON: {path} ({exc})") from exc

    if not isinstance(raw, dict):
        raise OrchestratorError("Spec root must be a JSON object.")

    goal = require_string(raw, "goal")
    constraints = require_string_list(raw, "constraints", default=[])
    acceptance_criteria = require_string_list(raw, "acceptance_criteria", default=[])
    check_commands = require_string_list(raw, "check_commands", default=[])
    model_backend = optional_string(raw, "model_backend", "auto").strip().lower()
    if model_backend not in {"auto", "openai", "codex-cli"}:
        raise OrchestratorError("Spec field 'model_backend' must be one of: auto, openai, codex-cli.")
    model = optional_string(raw, "model", DEFAULT_MODEL)
    api_base_url = optional_string(raw, "api_base_url", DEFAULT_API_BASE_URL)
    max_slices = require_int(raw, "max_slices", DEFAULT_MAX_SLICES, min_value=1, max_value=20)
    max_attempts_per_slice = require_int(
        raw,
        "max_attempts_per_slice",
        DEFAULT_MAX_ATTEMPTS_PER_SLICE,
        min_value=1,
        max_value=10,
    )
    max_files_per_slice = require_int(
        raw,
        "max_files_per_slice",
        DEFAULT_MAX_FILES_PER_SLICE,
        min_value=1,
        max_value=20,
    )
    command_timeout_seconds = require_int(
        raw,
        "command_timeout_seconds",
        DEFAULT_COMMAND_TIMEOUT_SECONDS,
        min_value=60,
        max_value=10_000,
    )
    working_directory = Path(optional_string(raw, "working_directory", ".")).resolve()
    context_files = require_string_list(raw, "context_files", default=[])
    planner_notes = optional_string(raw, "planner_notes", "")
    implementer_notes = optional_string(raw, "implementer_notes", "")
    reviewer_notes = optional_string(raw, "reviewer_notes", "")

    return Spec(
        goal=goal,
        constraints=constraints,
        acceptance_criteria=acceptance_criteria,
        check_commands=check_commands,
        model_backend=model_backend,
        model=model,
        api_base_url=api_base_url.rstrip("/"),
        max_slices=max_slices,
        max_attempts_per_slice=max_attempts_per_slice,
        max_files_per_slice=max_files_per_slice,
        command_timeout_seconds=command_timeout_seconds,
        working_directory=working_directory,
        context_files=context_files,
        planner_notes=planner_notes,
        implementer_notes=implementer_notes,
        reviewer_notes=reviewer_notes,
    )


def require_string(raw: dict[str, Any], key: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str) or not value.strip():
        raise OrchestratorError(f"Spec field '{key}' must be a non-empty string.")
    return value.strip()


def optional_string(raw: dict[str, Any], key: str, default: str) -> str:
    value = raw.get(key, default)
    if not isinstance(value, str):
        raise OrchestratorError(f"Spec field '{key}' must be a string.")
    return value


def require_string_list(raw: dict[str, Any], key: str, default: list[str]) -> list[str]:
    value = raw.get(key, default)
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise OrchestratorError(f"Spec field '{key}' must be an array of strings.")
    return [item.strip() for item in value if item.strip()]


def require_int(
    raw: dict[str, Any],
    key: str,
    default: int,
    *,
    min_value: int,
    max_value: int,
) -> int:
    value = raw.get(key, default)
    if not isinstance(value, int):
        raise OrchestratorError(f"Spec field '{key}' must be an integer.")
    if value < min_value or value > max_value:
        raise OrchestratorError(f"Spec field '{key}' must be between {min_value} and {max_value}.")
    return value


def run_cmd(command: str, cwd: Path, timeout_seconds: int) -> tuple[int, str]:
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        output = (completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")
        return completed.returncode, output.strip()
    except subprocess.TimeoutExpired as exc:
        return 124, f"Command timed out after {timeout_seconds}s: {command}\n{exc}"


def git_file_list(cwd: Path) -> list[str]:
    code, output = run_cmd("git ls-files", cwd=cwd, timeout_seconds=30)
    if code != 0:
        raise OrchestratorError(f"Failed to list tracked files with git ls-files:\n{output}")
    paths = [line.strip() for line in output.splitlines() if line.strip()]
    filtered = [p for p in paths if not p.startswith(RUNS_DIR)]
    return filtered[:MAX_REPO_FILES]


def current_changed_paths(cwd: Path) -> set[str]:
    code, output = run_cmd("git status --porcelain", cwd=cwd, timeout_seconds=30)
    if code != 0:
        return set()
    changed: set[str] = set()
    for line in output.splitlines():
        if not line.strip():
            continue
        # Format: XY <path> or XY <from> -> <to>
        path_part = line[3:].strip()
        if " -> " in path_part:
            path_part = path_part.split(" -> ", 1)[1]
        changed.add(path_part)
    return changed


def normalize_rel_path(path: str) -> str:
    path = path.strip().replace("\\", "/")
    if not path or path.startswith("/") or path.startswith("../") or "/../" in path:
        raise OrchestratorError(f"Unsafe path from model output: {path!r}")
    if path.startswith("./"):
        path = path[2:]
    return path


def read_context_files(spec: Spec, cwd: Path) -> str:
    if not spec.context_files:
        return ""
    parts: list[str] = []
    for rel in spec.context_files:
        rel_norm = normalize_rel_path(rel)
        target = cwd / rel_norm
        if not target.exists():
            parts.append(f"## {rel_norm}\n[missing file]")
            continue
        content = target.read_text(encoding="utf-8")
        if len(content) > MAX_FILE_CHARS:
            content = content[:MAX_FILE_CHARS] + "\n\n[TRUNCATED]"
        parts.append(f"## {rel_norm}\n{content}")
    return "\n\n".join(parts)


def extract_json_object(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if not stripped:
        raise OrchestratorError("Model response was empty when JSON was required.")

    # Strip markdown fences if present.
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", stripped, flags=re.DOTALL | re.IGNORECASE)
    if fence_match:
        stripped = fence_match.group(1).strip()

    try:
        value = json.loads(stripped)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass

    decoder = json.JSONDecoder()
    for start in range(len(stripped)):
        if stripped[start] != "{":
            continue
        try:
            value, end = decoder.raw_decode(stripped[start:])
            if isinstance(value, dict):
                trailing = stripped[start + end :].strip()
                if not trailing or trailing.startswith("\n"):
                    return value
        except json.JSONDecodeError:
            continue

    raise OrchestratorError(f"Could not parse JSON object from model output:\n{text}")


class OpenAIChatClient:
    def __init__(self, api_key: str, model: str, api_base_url: str):
        self.api_key = api_key
        self.model = model
        self.api_base_url = api_base_url.rstrip("/")

    def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 3000,
    ) -> str:
        url = f"{self.api_base_url}/chat/completions"
        payload = {
            "model": self.model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise OrchestratorError(
                f"OpenAI API request failed ({exc.code}): {body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise OrchestratorError(f"OpenAI API network failure: {exc}") from exc

        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            raise OrchestratorError(f"Unexpected OpenAI response: {data}")
        message = choices[0].get("message", {})
        content = message.get("content")
        if not isinstance(content, str):
            raise OrchestratorError(f"Unexpected OpenAI response content: {data}")
        return content


class CodexCliClient:
    def __init__(self, model: str, cwd: Path):
        self.model = model
        self.cwd = cwd
        self.codex_bin = os.getenv("CODEX_CLI_BIN", "codex")
        effort = os.getenv("CODEX_REASONING_EFFORT", DEFAULT_CODEX_REASONING_EFFORT).strip().lower()
        if effort not in {"minimal", "low", "medium", "high", "xhigh"}:
            effort = DEFAULT_CODEX_REASONING_EFFORT
        self.reasoning_effort = effort

    def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 3000,
    ) -> str:
        del temperature, max_tokens

        prompt = (
            f"{system_prompt}\n\n"
            "Follow all instructions exactly. Return only the final answer with no preamble.\n\n"
            f"{user_prompt}"
        )
        with tempfile.TemporaryDirectory(prefix="ai_orchestrator_") as temp_dir:
            out_file = Path(temp_dir) / "last_message.txt"
            cmd = [
                self.codex_bin,
                "exec",
                "--ephemeral",
                "--sandbox",
                "read-only",
                "--skip-git-repo-check",
                "-C",
                str(self.cwd),
                "-c",
                "mcp_servers={}",
                "-c",
                f'model_reasoning_effort="{self.reasoning_effort}"',
                "--output-last-message",
                str(out_file),
            ]
            if self.model:
                cmd += ["-m", self.model]
            cmd += ["-"]
            completed = subprocess.run(
                cmd,
                input=prompt,
                text=True,
                capture_output=True,
                timeout=900,
            )
            if completed.returncode != 0:
                stderr = (completed.stderr or "").strip()
                stdout = (completed.stdout or "").strip()
                raise OrchestratorError(
                    f"codex exec failed (exit {completed.returncode}).\n"
                    f"stderr:\n{stderr[-4000:]}\n\nstdout:\n{stdout[-4000:]}"
                )
            if not out_file.exists():
                raise OrchestratorError("codex exec did not produce output-last-message file.")
            return out_file.read_text(encoding="utf-8")


def create_client(spec: Spec) -> Any:
    backend = spec.model_backend
    api_key = os.getenv("OPENAI_API_KEY")
    if backend in {"openai", "auto"} and api_key:
        return OpenAIChatClient(api_key=api_key, model=spec.model, api_base_url=spec.api_base_url)
    if backend in {"codex-cli", "auto"}:
        return CodexCliClient(model=spec.model, cwd=spec.working_directory)
    if backend == "openai" and not api_key:
        raise OrchestratorError("OPENAI_API_KEY is required when model_backend=openai.")
    raise OrchestratorError(f"Unable to initialize model backend: {backend}")


def build_plan(
    *,
    client: OpenAIChatClient,
    spec: Spec,
    repo_files: list[str],
    context_text: str,
    logger: RunLogger,
) -> list[SlicePlan]:
    system_prompt = (
        "You are a principal engineer planning a large implementation into testable slices. "
        "Return strict JSON only. No markdown fences."
    )
    user_prompt = textwrap.dedent(
        f"""
        Build a sequential implementation plan for this software goal.

        Goal:
        {spec.goal}

        Constraints:
        {json.dumps(spec.constraints, ensure_ascii=False)}

        Global acceptance criteria:
        {json.dumps(spec.acceptance_criteria, ensure_ascii=False)}

        Global check commands that run after each slice:
        {json.dumps(spec.check_commands, ensure_ascii=False)}

        Repository files (truncated):
        {json.dumps(repo_files, ensure_ascii=False)}

        Additional context files:
        {context_text or "[none]"}

        Planner notes:
        {spec.planner_notes or "[none]"}

        Return this JSON shape exactly:
        {{
          "slices": [
            {{
              "id": "S1",
              "title": "short title",
              "objective": "what to implement in this slice",
              "acceptance": ["slice-specific acceptance criteria"],
              "check_commands": ["optional extra checks for this slice"],
              "files_hint": ["likely files to modify or create"]
            }}
          ]
        }}

        Rules:
        - Create between 1 and {spec.max_slices} slices.
        - Order slices by dependency.
        - Keep each slice implementable in one focused iteration.
        - Do not include exploratory or documentation-only slices unless needed for implementation.
        - Use concrete acceptance criteria, not vague language.
        """
    ).strip()
    raw = client.complete(system_prompt=system_prompt, user_prompt=user_prompt, max_tokens=4500)
    logger.write_text("01-plan/raw_response.txt", raw)
    payload = extract_json_object(raw)
    logger.write_json("01-plan/parsed_plan.json", payload)

    slices_raw = payload.get("slices")
    if not isinstance(slices_raw, list) or not slices_raw:
        raise OrchestratorError("Planner returned no slices.")

    slices: list[SlicePlan] = []
    for index, item in enumerate(slices_raw, start=1):
        if not isinstance(item, dict):
            raise OrchestratorError(f"Planner slice #{index} is not an object.")
        slice_id = str(item.get("id", f"S{index}")).strip() or f"S{index}"
        title = str(item.get("title", "")).strip()
        objective = str(item.get("objective", "")).strip()
        if not title or not objective:
            raise OrchestratorError(f"Planner slice #{index} missing title or objective.")
        acceptance = ensure_str_array(item.get("acceptance", []))
        check_commands = ensure_str_array(item.get("check_commands", []))
        files_hint = ensure_str_array(item.get("files_hint", []))
        slices.append(
            SlicePlan(
                id=slice_id,
                title=title,
                objective=objective,
                acceptance=acceptance,
                check_commands=check_commands,
                files_hint=files_hint,
            )
        )
    return slices[: spec.max_slices]


def ensure_str_array(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
    return out


def choose_files_for_slice(
    *,
    client: OpenAIChatClient,
    spec: Spec,
    slice_plan: SlicePlan,
    repo_files: list[str],
    logger: RunLogger,
    slice_dir: str,
) -> tuple[list[str], list[str]]:
    system_prompt = (
        "You are selecting files required to implement one software slice. "
        "Return strict JSON only."
    )
    user_prompt = textwrap.dedent(
        f"""
        Select files for this slice.

        Slice ID: {slice_plan.id}
        Title: {slice_plan.title}
        Objective: {slice_plan.objective}
        Acceptance: {json.dumps(slice_plan.acceptance, ensure_ascii=False)}
        File hints from planner: {json.dumps(slice_plan.files_hint, ensure_ascii=False)}

        Repository files:
        {json.dumps(repo_files, ensure_ascii=False)}

        Return JSON:
        {{
          "files_to_read": ["existing file paths only"],
          "files_to_create": ["new file paths if needed"]
        }}

        Rules:
        - Choose at most {spec.max_files_per_slice} files_to_read.
        - Keep file set minimal.
        - Prefer explicit existing files from repository list.
        - Use repository-relative paths.
        """
    ).strip()
    raw = client.complete(system_prompt=system_prompt, user_prompt=user_prompt, max_tokens=1200)
    logger.write_text(f"{slice_dir}/01-file-selection/raw_response.txt", raw)
    payload = extract_json_object(raw)
    logger.write_json(f"{slice_dir}/01-file-selection/parsed_selection.json", payload)

    files_to_read = []
    for path in ensure_str_array(payload.get("files_to_read", [])):
        try:
            safe = normalize_rel_path(path)
        except OrchestratorError:
            continue
        if safe in repo_files:
            files_to_read.append(safe)

    files_to_create = []
    for path in ensure_str_array(payload.get("files_to_create", [])):
        try:
            safe = normalize_rel_path(path)
        except OrchestratorError:
            continue
        files_to_create.append(safe)

    # Add planner hints that exist if model skipped them.
    for hint in slice_plan.files_hint:
        try:
            safe_hint = normalize_rel_path(hint)
        except OrchestratorError:
            continue
        if safe_hint in repo_files and safe_hint not in files_to_read:
            files_to_read.append(safe_hint)

    files_to_read = files_to_read[: spec.max_files_per_slice]
    files_to_create = dedupe(files_to_create)
    return files_to_read, files_to_create


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def load_file_context(cwd: Path, files: list[str]) -> str:
    if not files:
        return "[no existing files selected]"
    blocks: list[str] = []
    for rel in files:
        path = cwd / rel
        if not path.exists():
            blocks.append(f"### FILE: {rel}\n[MISSING]")
            continue
        content = path.read_text(encoding="utf-8")
        if len(content) > MAX_FILE_CHARS:
            content = content[:MAX_FILE_CHARS] + "\n\n[TRUNCATED]"
        blocks.append(f"### FILE: {rel}\n{content}")
    return "\n\n".join(blocks)


def ask_for_changes(
    *,
    client: OpenAIChatClient,
    spec: Spec,
    slice_plan: SlicePlan,
    files_to_read: list[str],
    files_to_create: list[str],
    file_context: str,
    feedback: str,
    logger: RunLogger,
    slice_dir: str,
    attempt: int,
) -> dict[str, Any]:
    system_prompt = (
        "You are implementing a software slice. "
        "Return strict JSON only, no markdown fences. "
        "When updating a file, return the complete final content."
    )
    user_prompt = textwrap.dedent(
        f"""
        Implement this slice.

        Goal:
        {spec.goal}

        Global constraints:
        {json.dumps(spec.constraints, ensure_ascii=False)}

        Global acceptance criteria:
        {json.dumps(spec.acceptance_criteria, ensure_ascii=False)}

        Slice:
        - id: {slice_plan.id}
        - title: {slice_plan.title}
        - objective: {slice_plan.objective}
        - acceptance: {json.dumps(slice_plan.acceptance, ensure_ascii=False)}

        Files selected to read:
        {json.dumps(files_to_read, ensure_ascii=False)}

        Candidate files to create:
        {json.dumps(files_to_create, ensure_ascii=False)}

        Current file context:
        {file_context}

        Feedback from previous attempt (if any):
        {feedback or "[none]"}

        Implementer notes:
        {spec.implementer_notes or "[none]"}

        Return JSON exactly with this shape:
        {{
          "summary": "short summary",
          "changes": [
            {{
              "path": "relative/path.ext",
              "action": "upsert",
              "content": "full file content"
            }},
            {{
              "path": "relative/path.ext",
              "action": "delete"
            }}
          ]
        }}

        Rules:
        - Return only files needed for this slice.
        - Keep untouched files out of changes.
        - Use repository-relative paths only.
        - Do not include partial diffs.
        - Keep existing behavior unless required by the slice objective.
        """
    ).strip()
    raw = client.complete(system_prompt=system_prompt, user_prompt=user_prompt, max_tokens=7000)
    logger.write_text(f"{slice_dir}/02-attempt-{attempt}/raw_implementer_response.txt", raw)
    payload = extract_json_object(raw)
    logger.write_json(f"{slice_dir}/02-attempt-{attempt}/parsed_implementer_response.json", payload)
    return payload


def apply_changes(cwd: Path, changes_payload: dict[str, Any]) -> list[str]:
    changes = changes_payload.get("changes")
    if not isinstance(changes, list):
        raise OrchestratorError("Implementer response missing 'changes' array.")

    touched: list[str] = []
    for change in changes:
        if not isinstance(change, dict):
            continue
        path_value = change.get("path")
        action_value = change.get("action")
        if not isinstance(path_value, str) or not isinstance(action_value, str):
            continue
        rel_path = normalize_rel_path(path_value)
        action = action_value.strip().lower()
        target = cwd / rel_path
        if action == "upsert":
            content = change.get("content")
            if not isinstance(content, str):
                raise OrchestratorError(f"Missing content for upsert action on {rel_path}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            touched.append(rel_path)
        elif action == "delete":
            if target.exists():
                if target.is_dir():
                    raise OrchestratorError(f"Refusing to delete directory path: {rel_path}")
                target.unlink()
            touched.append(rel_path)
        else:
            raise OrchestratorError(f"Unknown change action '{action}' for {rel_path}")
    return dedupe(touched)


def run_checks(commands: list[str], cwd: Path, timeout_seconds: int, logger: RunLogger, log_prefix: str) -> list[CheckResult]:
    results: list[CheckResult] = []
    for index, command in enumerate(commands, start=1):
        exit_code, output = run_cmd(command, cwd=cwd, timeout_seconds=timeout_seconds)
        result = CheckResult(command=command, exit_code=exit_code, output=output)
        logger.write_text(
            f"{log_prefix}/check-{index:02d}.txt",
            f"$ {command}\n\nexit_code={exit_code}\n\n{output}",
        )
        results.append(result)
    return results


def checks_passed(results: list[CheckResult]) -> bool:
    return all(result.passed for result in results)


def summarize_check_results(results: list[CheckResult]) -> str:
    lines: list[str] = []
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        lines.append(f"[{status}] {result.command}")
        if not result.passed:
            lines.append(result.output[-4000:] if len(result.output) > 4000 else result.output)
            lines.append("")
    return "\n".join(lines).strip()


def git_diff_for_paths(cwd: Path, paths: list[str]) -> str:
    if not paths:
        return ""

    tracked_paths: list[str] = []
    untracked_paths: list[str] = []
    deleted_paths: list[str] = []
    for path in paths:
        code, _ = run_cmd(f"git ls-files --error-unmatch -- {shell_quote(path)}", cwd=cwd, timeout_seconds=30)
        abs_path = cwd / path
        if code == 0:
            tracked_paths.append(path)
        elif abs_path.exists():
            untracked_paths.append(path)
        else:
            deleted_paths.append(path)

    sections: list[str] = []
    if tracked_paths:
        quoted = " ".join(shell_quote(path) for path in tracked_paths)
        code, output = run_cmd(f"git diff -- {quoted}", cwd=cwd, timeout_seconds=30)
        if code != 0:
            sections.append(output)
        else:
            sections.append(output)

    for path in untracked_paths:
        abs_path = cwd / path
        if abs_path.is_dir():
            continue
        try:
            content = abs_path.read_text(encoding="utf-8")
        except Exception as exc:
            content = f"[unable to read file: {exc}]"
        if len(content) > MAX_FILE_CHARS:
            content = content[:MAX_FILE_CHARS] + "\n\n[TRUNCATED]"
        sections.append(
            "\n".join(
                [
                    f"### UNTRACKED FILE: {path}",
                    content,
                ]
            )
        )

    if deleted_paths:
        sections.append("### DELETED PATHS\n" + "\n".join(deleted_paths))

    output = "\n\n".join(section for section in sections if section.strip())
    if len(output) > 80_000:
        return output[:80_000] + "\n\n[DIFF TRUNCATED]"
    return output


def shell_quote(text: str) -> str:
    return "'" + text.replace("'", "'\"'\"'") + "'"


def review_slice(
    *,
    client: OpenAIChatClient,
    spec: Spec,
    slice_plan: SlicePlan,
    touched_paths: list[str],
    diff_text: str,
    check_results: list[CheckResult],
    logger: RunLogger,
    slice_dir: str,
    attempt: int,
) -> ReviewResult:
    system_prompt = (
        "You are a strict code reviewer focused on acceptance criteria and regressions. "
        "Return strict JSON only."
    )
    user_prompt = textwrap.dedent(
        f"""
        Review this slice attempt.

        Goal:
        {spec.goal}

        Global acceptance criteria:
        {json.dumps(spec.acceptance_criteria, ensure_ascii=False)}

        Slice:
        - id: {slice_plan.id}
        - title: {slice_plan.title}
        - objective: {slice_plan.objective}
        - acceptance: {json.dumps(slice_plan.acceptance, ensure_ascii=False)}

        Touched paths:
        {json.dumps(touched_paths, ensure_ascii=False)}

        Check results:
        {summarize_check_results(check_results) or "[no checks run]"}

        Diff:
        {diff_text or "[no diff captured]"}

        Reviewer notes:
        {spec.reviewer_notes or "[none]"}

        Return JSON:
        {{
          "pass": true,
          "issues": [],
          "required_fixes": []
        }}

        Rules:
        - pass=false if acceptance criteria are not met or if a regression risk is obvious.
        - Keep issues concrete and actionable.
        """
    ).strip()
    raw = client.complete(system_prompt=system_prompt, user_prompt=user_prompt, max_tokens=2200)
    logger.write_text(f"{slice_dir}/02-attempt-{attempt}/raw_reviewer_response.txt", raw)

    try:
        payload = extract_json_object(raw)
    except OrchestratorError:
        # Fall back to test result if reviewer output is malformed.
        return ReviewResult(
            passed=checks_passed(check_results),
            issues=["Reviewer output could not be parsed as JSON."],
            required_fixes=[],
            raw_output=raw,
        )

    passed = bool(payload.get("pass", False))
    issues = ensure_str_array(payload.get("issues", []))
    required_fixes = ensure_str_array(payload.get("required_fixes", []))
    return ReviewResult(
        passed=passed,
        issues=issues,
        required_fixes=required_fixes,
        raw_output=raw,
    )


def combine_commands(global_commands: list[str], slice_commands: list[str]) -> list[str]:
    combined = []
    seen = set()
    for command in [*slice_commands, *global_commands]:
        normalized = command.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        combined.append(normalized)
    return combined


def format_feedback(check_results: list[CheckResult], review: ReviewResult) -> str:
    parts: list[str] = []
    if check_results and not checks_passed(check_results):
        parts.append("Test/check failures:")
        parts.append(summarize_check_results(check_results))
    if not review.passed:
        parts.append("Reviewer findings:")
        if review.issues:
            parts.extend(f"- {issue}" for issue in review.issues)
        if review.required_fixes:
            parts.append("Required fixes:")
            parts.extend(f"- {fix}" for fix in review.required_fixes)
    return "\n".join(parts).strip()


def run(spec: Spec, continue_on_failure: bool) -> int:
    cwd = spec.working_directory
    if not cwd.exists():
        raise OrchestratorError(f"Working directory does not exist: {cwd}")

    run_dir = cwd / RUNS_DIR / now_stamp()
    logger = RunLogger(run_dir)
    logger.write_json("spec.json", spec_to_payload(spec))

    repo_files = git_file_list(cwd)
    context_text = read_context_files(spec, cwd)

    client = create_client(spec)
    slices = build_plan(client=client, spec=spec, repo_files=repo_files, context_text=context_text, logger=logger)

    baseline_changed = current_changed_paths(cwd)
    summary: dict[str, Any] = {
        "started_at": dt.datetime.now().isoformat(),
        "run_dir": str(run_dir),
        "slices": [],
        "failed": False,
    }
    logger.write_json("summary-progress.json", summary)

    for slice_index, slice_plan in enumerate(slices, start=1):
        slice_key = f"{slice_index:02d}-{slice_plan.id}"
        slice_dir = f"02-slices/{slice_key}"
        logger.write_json(
            f"{slice_dir}/slice.json",
            dataclasses.asdict(slice_plan),
        )

        files_to_read, files_to_create = choose_files_for_slice(
            client=client,
            spec=spec,
            slice_plan=slice_plan,
            repo_files=repo_files,
            logger=logger,
            slice_dir=slice_dir,
        )

        slice_touched = set()
        feedback = ""
        slice_passed = False
        attempt_summaries: list[dict[str, Any]] = []
        for attempt in range(1, spec.max_attempts_per_slice + 1):
            file_context = load_file_context(cwd, files_to_read)
            payload = ask_for_changes(
                client=client,
                spec=spec,
                slice_plan=slice_plan,
                files_to_read=files_to_read,
                files_to_create=files_to_create,
                file_context=file_context,
                feedback=feedback,
                logger=logger,
                slice_dir=slice_dir,
                attempt=attempt,
            )
            changed_paths = apply_changes(cwd, payload)
            slice_touched.update(changed_paths)
            repo_files = git_file_list(cwd)

            command_list = combine_commands(spec.check_commands, slice_plan.check_commands)
            check_results = run_checks(
                command_list,
                cwd=cwd,
                timeout_seconds=spec.command_timeout_seconds,
                logger=logger,
                log_prefix=f"{slice_dir}/02-attempt-{attempt}",
            )
            review = review_slice(
                client=client,
                spec=spec,
                slice_plan=slice_plan,
                touched_paths=sorted(slice_touched),
                diff_text=git_diff_for_paths(cwd, sorted(slice_touched)),
                check_results=check_results,
                logger=logger,
                slice_dir=slice_dir,
                attempt=attempt,
            )
            attempt_summary = {
                "attempt": attempt,
                "changed_paths": changed_paths,
                "checks_passed": checks_passed(check_results),
                "review_passed": review.passed,
                "review_issues": review.issues,
                "review_required_fixes": review.required_fixes,
            }
            attempt_summaries.append(attempt_summary)
            logger.write_json(f"{slice_dir}/02-attempt-{attempt}/attempt_summary.json", attempt_summary)

            if checks_passed(check_results) and review.passed:
                slice_passed = True
                break

            feedback = format_feedback(check_results, review)
            logger.write_text(f"{slice_dir}/02-attempt-{attempt}/feedback_for_next_attempt.txt", feedback)

        slice_summary = {
            "slice": dataclasses.asdict(slice_plan),
            "passed": slice_passed,
            "attempts": attempt_summaries,
            "touched_paths": sorted(slice_touched),
        }
        summary["slices"].append(slice_summary)
        summary["failed"] = summary["failed"] or not slice_passed
        logger.write_json("summary-progress.json", summary)

        if not slice_passed and not continue_on_failure:
            summary["stopped_at_slice"] = slice_plan.id
            break

    summary["ended_at"] = dt.datetime.now().isoformat()
    summary["final_changed_paths"] = sorted(current_changed_paths(cwd))
    summary["initial_changed_paths"] = sorted(baseline_changed)
    logger.write_json("summary-final.json", summary)

    print(f"Run directory: {run_dir}")
    print(f"Failed: {summary['failed']}")
    if summary["failed"]:
        return 1
    return 0


def print_plan(spec: Spec) -> int:
    cwd = spec.working_directory
    run_dir = cwd / RUNS_DIR / now_stamp()
    logger = RunLogger(run_dir)
    logger.write_json("spec.json", spec_to_payload(spec))

    repo_files = git_file_list(cwd)
    context_text = read_context_files(spec, cwd)
    client = create_client(spec)
    slices = build_plan(client=client, spec=spec, repo_files=repo_files, context_text=context_text, logger=logger)
    print(json.dumps([dataclasses.asdict(item) for item in slices], indent=2, ensure_ascii=False))
    print(f"\nPlan logs: {run_dir}")
    return 0


def main() -> int:
    try:
        args = parse_args()
        spec = load_spec(Path(args.spec))
        if args.command == "plan":
            return print_plan(spec)
        if args.command == "run":
            return run(spec, continue_on_failure=bool(args.continue_on_failure))
        raise OrchestratorError(f"Unknown command: {args.command}")
    except OrchestratorError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
