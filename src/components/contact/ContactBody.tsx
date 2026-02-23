import { Lang } from "@/types";
import ContactForm from "./ContactForm";
import ContactInfo from "./ContactInfo";
interface Props {
  locale: Lang;
}

export function ContactBody({ locale }: Props) {
  return (
    <div className="bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
          <div>
            <ContactInfo locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
