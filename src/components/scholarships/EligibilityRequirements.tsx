import Section from "@/components/layout/Section";
import { CheckCircle } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Who Can Apply",
    heading: "Eligibility Requirements",
    sub: "All of the following criteria must be met to be considered for the scholarship.",
    requirements: [
      {
        title: "Bleeding Disorder Connection",
        body: "Must be a student diagnosed with hemophilia or Von Willebrand Disease, or an immediate family member of someone with a bleeding disorder.",
      },
      {
        title: "U.S. Residency",
        body: "Must be a United States resident.",
      },
      {
        title: "Healthcare or Pharmacy Enrollment",
        body: "Must be accepted to or currently enrolled in a Pharmacy or Healthcare curriculum at a college, university, or technical school in the United States on a full-time basis (12 credit hours or more).",
      },
      {
        title: "Minimum GPA of 2.5",
        body: "Must maintain a minimum grade point average of 2.5 on a 4.0 scale during the entire senior year of high school, or current year of college or graduate school.",
      },
      {
        title: "Proof of Enrollment",
        body: "Must provide proof of admission or enrollment to the college, university, technical school, or certification program.",
      },
      {
        title: "Essay Submission",
        body: 'Must submit a 300–400 word essay answering: "How will you be advocating for bleeding disorders through your time in college?"',
      },
    ],
  },
  es: {
    eyebrow: "Quién Puede Aplicar",
    heading: "Requisitos de Elegibilidad",
    sub: "Todos los siguientes criterios deben cumplirse para ser considerado para la beca.",
    requirements: [
      {
        title: "Conexión con Trastorno Hemorrágico",
        body: "Debe ser un estudiante diagnosticado con hemofilia o enfermedad de Von Willebrand, o un familiar inmediato de alguien con un trastorno hemorrágico.",
      },
      {
        title: "Residencia en EE.UU.",
        body: "Debe ser residente de los Estados Unidos.",
      },
      {
        title: "Inscripción en Salud o Farmacia",
        body: "Debe estar aceptado o inscrito actualmente en un plan de estudios de Farmacia o Atención Médica en una universidad o escuela técnica en EE.UU. a tiempo completo (12 créditos o más).",
      },
      {
        title: "Promedio Mínimo de 2.5",
        body: "Debe mantener un promedio mínimo de 2.5 en una escala de 4.0 durante el año escolar actual.",
      },
      {
        title: "Prueba de Inscripción",
        body: "Debe proporcionar prueba de admisión o inscripción al colegio, universidad o escuela técnica.",
      },
      {
        title: "Ensayo",
        body: 'Debe enviar un ensayo de 300–400 palabras respondiendo: "¿Cómo abogará por los trastornos hemorrágicos durante su tiempo en la universidad?"',
      },
    ],
  },
};

export default function EligibilityRequirements({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="white" id="eligibility">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.eyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          {t.heading}
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {t.requirements.map((req, i) => (
          <div
            key={req.title}
            className="flex gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-neutral-900 text-sm mb-1">
                {req.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {req.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
