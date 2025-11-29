import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Clock,
  CheckCircle,
  Shield,
  MessageSquare,
  Users,
  Globe,
  Zap,
  HelpCircle,
  Search,
  Briefcase,
  MapPin,
} from 'lucide-react';
import HomeSearch from '@/components/HomeSearch';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Tražim-Radnike<span className="text-slate-400">.online</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="#oglasna-tabla"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Oglasna tabla
            </Link>
            <Link
              href="#kako-radi"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Kako funkcioniše
            </Link>
            <Link
              href="/prijava"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Prijava
            </Link>
            <Link
              href="/registracija"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Besplatna registracija
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            Radnici iz Indije • Nepala • Egipta • Bangladeša
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Trebaju vam radnici?
            <span className="block text-blue-600 mt-2">Mi vam pomažemo da ih pronađete.</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
            Specijalizovani smo za <strong>radnike iz Indije, Nepala, Egipta i Bangladeša</strong>.
            Vredni ljudi koji dolaze spremni za posao — mi sredimo sve papire i dozvole.
          </p>

          <p className="text-base text-slate-500 max-w-xl mx-auto mb-8">
            Plata 600-800€ + smeštaj. Proces traje 2-4 nedelje.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/registracija"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/25"
            >
              Opišite koga tražite
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/oglasi"
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Search className="mr-2 h-5 w-5" />
              Pogledaj oglase
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Oglas je BESPLATAN
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Sredimo sve papire
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              2-4 nedelje do dolaska
            </div>
          </div>
        </div>
      </section>

      {/* Oglasna Tabla Section */}
      <section id="oglasna-tabla" className="bg-slate-900 text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Besplatna oglasna tabla
            </h2>
            <p className="text-lg text-slate-300">
              Firme, majstori, fizička lica — svi mogu da postave oglas ili da traže posao.
              <br />
              <span className="text-blue-400 font-semibold">Potpuno BESPLATNO!</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Za poslodavce */}
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold">Za poslodavce</h3>
              </div>
              <ul className="space-y-3 text-slate-300 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Postavi besplatan oglas za radnike
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Dobij biznis profil na platformi
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Konsultacije za strane radnike
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Mi sredimo dokumentaciju
                </li>
              </ul>
              <Link
                href="/registracija"
                className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Postavi oglas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Za radnike/majstore */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold">Za radnike i majstore</h3>
              </div>
              <ul className="space-y-3 text-slate-300 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Postavi besplatan oglas o sebi
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Pretraži poslove po zanatu
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Pretraži poslove po mestu
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  Neka te poslodavci pronađu
                </li>
              </ul>
              <Link
                href="/registracija"
                className="inline-flex items-center justify-center w-full rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white hover:bg-slate-600 transition-colors"
              >
                Registruj se
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Search preview */}
          <HomeSearch />
        </div>
      </section>

      {/* Problem/Solution for Foreign Workers */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Zašto radnici iz inostranstva?
              </h2>
              <p className="text-lg text-slate-600">
                Teško nalazite radnike lokalno? Mi imamo rešenje.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Problems */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                <h3 className="text-red-700 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">😩</span> Lokalna situacija
                </h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    Nema dovoljno radnika na tržištu
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    Teško naći pouzdane ljude
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    Stalna fluktuacija radne snage
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    Visoka očekivanja, nizak angažman
                  </li>
                </ul>
              </div>

              {/* Solutions */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                <h3 className="text-green-700 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">😊</span> Radnici iz inostranstva
                </h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    Vredni i pouzdani radnici
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    Dolaze spremni za posao
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    Stabilni - žele da ostanu
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    Konkurentne plate (600-800€)
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Mi se brinemo o svemu</h4>
                  <p className="text-slate-600">
                    Dozvole, papiri, procedure — sve to sredimo mi. Vi samo obezbedite smeštaj i platu,
                    a radnik dolazi spreman za posao. Uče osnove srpskog pre dolaska.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="kako-radi" className="bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Kako funkcioniše?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Jednostavan proces — bez komplikacija
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              step={1}
              icon={<MessageSquare className="h-6 w-6" />}
              title="Opišite potrebe"
              description="Razgovarajte sa Botislavom - naš AI asistent prikuplja informacije o tome kakve radnike tražite. Traje 5 minuta."
            />
            <StepCard
              step={2}
              icon={<FileText className="h-6 w-6" />}
              title="Dobijte ponudu"
              description="Naš tim vam šalje konkretnu ponudu na email u roku od 24h. Vidite sve crno na belo, bez obaveza."
            />
            <StepCard
              step={3}
              icon={<Users className="h-6 w-6" />}
              title="Radnici dolaze"
              description="Mi sredimo sve papire i dozvole. Za 2-4 nedelje radnici dolaze spremni za posao."
            />
          </div>
        </div>
      </section>

      {/* What you need */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Šta vam treba?
            </h2>
            <p className="text-lg text-slate-600">
              Da bi radnici iz inostranstva došli kod vas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <RequirementCard
              icon={<span className="text-3xl">🏠</span>}
              title="Smeštaj"
              description="Obezbedite smeštaj za radnike - stan, soba, ili radnički dom"
            />
            <RequirementCard
              icon={<span className="text-3xl">💰</span>}
              title="Plata"
              description="600-800€ mesečno zavisno od pozicije i iskustva"
            />
            <RequirementCard
              icon={<span className="text-3xl">🍽️</span>}
              title="Ishrana"
              description="Organizujte ishranu ili dodatak za hranu"
            />
            <RequirementCard
              icon={<span className="text-3xl">📋</span>}
              title="Prijava"
              description="Zvanično zaposlenje - mi pomažemo sa papirologijom"
            />
          </div>
        </div>
      </section>

      {/* Social proof / Stats */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
                <div className="text-blue-100">Radnika posredovano</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">4</div>
                <div className="text-blue-100">Zemlje izvora</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">2-4</div>
                <div className="text-blue-100">Nedelje do dolaska</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">24h</div>
                <div className="text-blue-100">Odgovor na zahtev</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Česta pitanja
            </h2>

            <div className="space-y-4">
              <FaqItem
                question="Iz kojih zemalja su radnici?"
                answer="Specijalizovani smo za radnike iz Indije, Nepala, Egipta i Bangladeša. To su vredni i pouzdani ljudi koji dolaze spremni za posao."
              />
              <FaqItem
                question="Koliko košta vaša usluga?"
                answer="Postavljanje oglasa je potpuno besplatno. Za kompletnu uslugu (dokumentacija, dozvole, organizacija dolaska) kontaktirajte nas za ponudu."
              />
              <FaqItem
                question="Koliko traje proces?"
                answer="Od momenta dogovora do dolaska radnika prolazi obično 2-4 nedelje, zavisno od zemlje i vrste posla."
              />
              <FaqItem
                question="Da li radnici znaju srpski?"
                answer="Radnici prolaze kroz osnovnu obuku srpskog jezika pre dolaska. Za složenije komunikacije, obično jedan od njih služi kao prevodilac za grupu."
              />
              <FaqItem
                question="Šta ako radnik ne odgovara?"
                answer="Imamo garanciju zamene. Ako radnik ne ispuni očekivanja u prvih mesec dana, obezbeđujemo zamenu bez dodatnih troškova."
              />
              <FaqItem
                question="Ko može da koristi oglasnu tablu?"
                answer="Svi! Firme koje traže radnike, majstori koji traže posao, fizička lica - oglasna tabla je besplatna za sve korisnike."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Spremni da počnete?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            Registracija je besplatna. Opišite koga tražite i mi vam šaljemo ponudu u roku od 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registracija"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/25"
            >
              Besplatna registracija
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#oglasna-tabla"
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-600 px-8 py-4 text-lg font-semibold text-white hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              Pogledaj oglasnu tablu
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Bez kreditne kartice • Bez obaveza • Oglas je besplatan
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold text-white mb-4">
                Tražim-Radnike<span className="text-slate-500">.online</span>
              </div>
              <p className="text-sm">
                Platforma za pronalaženje radnika iz inostranstva i besplatna oglasna tabla.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Usluge</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/registracija" className="hover:text-white transition-colors">Radnici iz inostranstva</Link></li>
                <li><Link href="#oglasna-tabla" className="hover:text-white transition-colors">Oglasna tabla</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Dokumentacija</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Podrška</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#kako-radi" className="hover:text-white transition-colors">Kako funkcioniše</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Česta pitanja</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Kontakt</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Pravno</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/politika-privatnosti" className="hover:text-white transition-colors">Politika privatnosti</Link></li>
                <li><Link href="/uslovi-koriscenja" className="hover:text-white transition-colors">Uslovi korišćenja</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            <p>© {new Date().getFullYear()} Tražim-Radnike.online | NKNet-Consulting.com</p>
            <p className="mt-2 text-slate-500">
              Specijalizovani za radnike iz Indije, Nepala, Egipta i Bangladeša.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
        {step}
      </div>
      <div className="mt-4 mb-4 w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function RequirementCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow text-center">
      <div className="mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group bg-white rounded-lg border">
      <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-slate-900">
        {question}
        <span className="ml-4 text-slate-400 group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
