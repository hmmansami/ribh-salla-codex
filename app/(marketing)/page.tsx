"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export default function HomePage() {
  const { locale, dict } = useLocale();

  const isAr = locale === "ar";

  const outcomeCards = [
    {
      title: isAr ? "وعد ربح (ضغطة واحدة)" : "Ribh Promise (One Click)",
      points: isAr
        ? [
            "تشغيل محرك النمو بالكامل بضغطة واحدة.",
            "بدء سريع بدون إعداد طويل.",
            "ظهور فرص الإيراد مباشرة مع تحكم متقدم اختياري."
          ]
        : [
            "Launch the entire growth engine with one click.",
            "Fast activation without long setup paths.",
            "Immediate revenue opportunities with optional advanced controls."
          ]
    },
    {
      title: isAr ? "وعد K (تسويق تلقائي)" : "K Promise (Automatic Marketing)",
      points: isAr
        ? [
            "أتمتة رحلات دورة حياة العميل عبر كل القنوات.",
            "الرسالة المناسبة في الوقت المناسب.",
            "توحيد البيانات والقنوات والقياس."
          ]
        : [
            "Automated lifecycle marketing across channels.",
            "Right message at the right moment.",
            "Unified data, activation, and measurement loop."
          ]
    },
    {
      title: isAr ? "وعد Attintave (تخصيص بالذكاء)" : "Attintave Promise (AI Personalized)",
      points: isAr
        ? [
            "تخصيص 1:1 على نطاق واسع عبر SMS وواتساب والبريد.",
            "ذكاء للجمهور والتوقيت والمحتوى.",
            "زيادة الإيراد لكل رسالة."
          ]
        : [
            "1:1 personalization at scale across SMS, WhatsApp, and email.",
            "AI for audience, timing, and content generation.",
            "Higher revenue per message sent."
          ]
    }
  ];

  const principles = isAr
    ? [
        "البيانات: مزامنة بيانات سلة (طلبات، عملاء، منتجات، سلوك).",
        "الهوية والموافقة: سجل موافقات لكل قناة (تسويقي/معاملات).",
        "الذكاء القرارى: اختيار الجمهور/القناة/التوقيت/العرض تلقائيا.",
        "الإبداع بالذكاء: قوالب ورسائل مولدة بالعربية والإنجليزية.",
        "الأتمتة: رحلات الترحيب، السلة المتروكة، ما بعد الشراء، الاسترجاع.",
        "التحويل: إرسال القناة الأفضل مع مسار احتياطي تلقائي.",
        "القياس: Attribution + Incrementality في لوحة واحدة.",
        "التحكم: وضع ضغطة واحدة + وضع متقدم بلا حذف للميزات."
      ]
    : [
        "Data: sync Salla orders, customers, products, and behavior.",
        "Identity + consent: channel-level consent ledger.",
        "Decision intelligence: auto-pick audience, channel, timing, offer.",
        "AI creative: localized generated templates and copy.",
        "Automation: welcome, abandon cart, post-purchase, winback journeys.",
        "Conversion: best-channel send with automatic fallback.",
        "Measurement: attribution + incrementality in one view.",
        "Control: one-click mode + advanced mode without feature deletion."
      ];

  const tableRows = isAr
    ? [
        [
          "البيانات",
          "تكاملات سلة الحية + موصلات ربح + مزامنة مخزن بيانات",
          "استيراد لحظي ومزامنة دورية مع فحص جودة",
          "مصدر موحد لاتخاذ القرار"
        ],
        [
          "الموافقة",
          "محرك موافقات + قواعد امتثال سعودية",
          "التحقق قبل الإرسال حسب القناة ونوع الرسالة",
          "نمو آمن وقابل للتوسع"
        ],
        [
          "الاستهداف",
          "ذكاء الجمهور + توقع القيمة + تفضيل القناة",
          "ترتيب العملاء حسب نية الشراء",
          "تحويل أعلى"
        ],
        [
          "المحتوى",
          "قوالب مولدة + مكتبة قوالب كاملة",
          "تقليل 350 قالب إلى مولد ذكي مع حفظ المكتبة",
          "سرعة إنتاج مع تخصيص"
        ],
        [
          "الأتمتة",
          "مصمم رحلات + وصفات جاهزة + تشغيل تلقائي",
          "تفعيل الرحلات الأساسية فوريا",
          "إيراد مستمر"
        ],
        [
          "القياس",
          "لوحات إسناد + اختبار الرفع",
          "مقارنة الإيراد المنسوب والفعلي",
          "ثقة أعلى في القرارات"
        ]
      ]
    : [
        [
          "Data",
          "Live Salla integration + Ribh connectors + warehouse sync",
          "Real-time + scheduled sync with quality checks",
          "Single source of truth"
        ],
        [
          "Consent",
          "Consent engine + KSA policy rules",
          "Pre-send validation by channel and message type",
          "Safe scalable growth"
        ],
        [
          "Targeting",
          "Audience AI + value prediction + channel affinity",
          "Rank profiles by purchase intent",
          "Higher conversion"
        ],
        [
          "Content",
          "Generative templates + full template library",
          "Collapse 350 templates into AI-first generation",
          "Fast personalized production"
        ],
        [
          "Automation",
          "Journey builder + recipes + one-click activation",
          "Instant baseline lifecycle deployment",
          "Always-on revenue capture"
        ],
        [
          "Measurement",
          "Attribution dashboards + lift testing",
          "Compare attributed vs incremental outcomes",
          "Higher decision confidence"
        ]
      ];

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "ربح: منصة نمو سلة بضغطة واحدة" : "Ribh: Salla-first One-Click Growth Platform"}</h1>
        <p>
          {isAr
            ? "نمزج أفضل ربح + K + Attintave في تجربة واحدة: تشغيل فوري، أتمتة كاملة، وتخصيص بالذكاء الاصطناعي."
            : "Merge the best of Ribh + K + Attintave: instant activation, full automation, and AI personalization."}
        </p>
        <div className="row">
          <Link href="/app/launch" className="primaryBtn">
            {dict.nav.start}
          </Link>
          <span className="pillTag">{isAr ? "سلة أولا" : "Salla First"}</span>
        </div>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "ما هو الناتج؟" : "What is the outcome?"}</h2>
        <div className="cardsGrid">
          {outcomeCards.map((card) => (
            <article key={card.title} className="card">
              <h3>{card.title}</h3>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "ما هي البنية (المبادئ الأولى)؟" : "What is the structure (first principles)?"}</h2>
        <ol className="steps">
          {principles.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "الأدوات والطرق للوصول للناتج" : "Tools and methods to get the outcome"}</h2>
        <div className="dataTableWrap">
          <table>
            <thead>
              <tr>
                <th>{isAr ? "المبدأ" : "Principle"}</th>
                <th>{isAr ? "الأدوات" : "Tools"}</th>
                <th>{isAr ? "الطريقة" : "Method"}</th>
                <th>{isAr ? "الناتج" : "Outcome"}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
