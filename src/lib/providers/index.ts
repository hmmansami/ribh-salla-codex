import { emailAdapter } from "@/lib/providers/email";
import { smsAdapter } from "@/lib/providers/sms";
import { whatsappAdapter } from "@/lib/providers/whatsapp";
import type { Channel } from "@/lib/types/domain";
import type { SendInput } from "@/lib/providers/types";

const adapterMap = {
  email: emailAdapter,
  sms: smsAdapter,
  whatsapp: whatsappAdapter
};

export async function sendThroughChannel(input: SendInput) {
  const adapter = adapterMap[input.channel as Channel];
  return adapter.send(input);
}
