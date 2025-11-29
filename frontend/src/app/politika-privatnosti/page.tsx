import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politika privatnosti',
  description: 'Politika privatnosti i zaštita podataka na Tražim-Radnike.online',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Tražim-Radnike.online
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Politika privatnosti
          </h1>

          <p className="text-sm text-gray-500 mb-8">
            Poslednja izmena: {new Date().toLocaleDateString('sr-RS')}
          </p>

          <div className="prose prose-blue max-w-none">
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Uvod</h2>
            <p className="mb-4">
              Tražim-Radnike.online (u daljem tekstu: "Platforma", "mi", "naš") je web platforma
              u vlasništvu kompanije NKNet Consulting d.o.o. sa sedištem u Srbiji. Posvećeni smo
              zaštiti vaše privatnosti i osobnih podataka u skladu sa Zakonom o zaštiti podataka
              o ličnosti Republike Srbije i Opštom uredbom o zaštiti podataka (GDPR) Evropske Unije.
            </p>
            <p className="mb-4">
              Ova Politika privatnosti opisuje kako prikupljamo, koristimo, čuvamo i štitimo
              vaše lične podatke kada koristite našu Platformu.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Podaci koje prikupljamo</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">2.1 Podaci koje nam direktno dajete:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Podaci za registraciju:</strong> email adresa, broj telefona, lozinka</li>
              <li><strong>Podaci o kompaniji:</strong> naziv firme, PIB, matični broj, adresa, grad, država</li>
              <li><strong>Podaci o oglasima:</strong> opis pozicije, broj radnika, plata, lokacija, smeštaj, zahtevi</li>
              <li><strong>Fotografije:</strong> slike radnog mesta, smeštaja (opciono)</li>
              <li><strong>Komunikacija:</strong> poruke koje šaljete putem chat sistema</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 Automatski prikupljeni podaci:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>IP adresa</li>
              <li>Tip i verzija pretraživača</li>
              <li>Operativni sistem</li>
              <li>Datum i vreme pristupa</li>
              <li>Stranice koje posećujete</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Svrha obrade podataka</h2>
            <p className="mb-4">Vaše podatke koristimo za sledeće svrhe:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Kreiranje i upravljanje vašim nalogom</li>
              <li>Pružanje konsultantskih usluga u vezi sa dokumentacijom za zapošljavanje</li>
              <li>Komunikaciju u vezi sa vašim zahtevima</li>
              <li>Poboljšanje naše platforme i korisničkog iskustva</li>
              <li>Slanje obaveštenja o novim porukama i ažuriranjima (možete se odjaviti)</li>
              <li>Poštovanje zakonskih obaveza</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Pravni osnov obrade</h2>
            <p className="mb-4">Obrađujemo vaše podatke na osnovu:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Saglasnosti:</strong> Vaša eksplicitna saglasnost pri registraciji</li>
              <li><strong>Izvršenja ugovora:</strong> Neophodna obrada za pružanje usluga</li>
              <li><strong>Legitimnog interesa:</strong> Poboljšanje naših usluga, sigurnost platforme</li>
              <li><strong>Zakonske obaveze:</strong> Čuvanje podataka prema zakonskim zahtevima</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Deljenje podataka</h2>
            <p className="mb-4">
              Vaše podatke ne prodajemo niti ustupamo trećim licima u marketinške svrhe.
              Podatke delimo samo sa:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Pružaoci usluga:</strong> hosting (Vercel, AWS), email (Resend), SMS (Twilio)</li>
              <li><strong>Zakonske obaveze:</strong> Državni organi na zahtev u skladu sa zakonom</li>
            </ul>
            <p className="mb-4">
              Svi pružaoci usluga su obavezani ugovorima o obradi podataka i moraju da štite
              vaše podatke u skladu sa ovom Politikom.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Čuvanje podataka</h2>
            <p className="mb-4">Vaše podatke čuvamo:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Podaci naloga:</strong> Dok je nalog aktivan + 3 godine nakon zatvaranja</li>
              <li><strong>Oglasi:</strong> Dok su aktivni + 1 godina nakon isteka</li>
              <li><strong>Poruke:</strong> 2 godine od poslednje aktivnosti</li>
              <li><strong>Logovi pristupa:</strong> 1 godina</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Vaša prava</h2>
            <p className="mb-4">U skladu sa GDPR i lokalnim zakonima, imate pravo na:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Pristup:</strong> Zatražite kopiju svojih podataka</li>
              <li><strong>Ispravku:</strong> Ispravite netačne podatke</li>
              <li><strong>Brisanje:</strong> Zatražite brisanje podataka ("pravo na zaborav")</li>
              <li><strong>Ograničenje obrade:</strong> Ograničite način na koji koristimo vaše podatke</li>
              <li><strong>Prenosivost:</strong> Preuzmite podatke u mašinski čitljivom formatu</li>
              <li><strong>Prigovor:</strong> Prigovorite obradi podataka</li>
              <li><strong>Povlačenje saglasnosti:</strong> Povucite saglasnost u bilo kom trenutku</li>
            </ul>
            <p className="mb-4">
              Za ostvarivanje svojih prava, kontaktirajte nas na:{' '}
              <a href="mailto:privacy@trazim-radnike.online" className="text-blue-600 hover:underline">
                privacy@trazim-radnike.online
              </a>
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Sigurnost podataka</h2>
            <p className="mb-4">Primenjujemo tehničke i organizacione mere za zaštitu podataka:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>SSL/TLS enkripcija za sve komunikacije</li>
              <li>Enkripcija lozinki (bcrypt)</li>
              <li>Kontrola pristupa podacima</li>
              <li>Redovne sigurnosne provere</li>
              <li>Audit logovi za praćenje pristupa</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Kolačići (Cookies)</h2>
            <p className="mb-4">
              Koristimo samo neophodne kolačiće za funkcionalnost platforme:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Autentifikacija:</strong> Za čuvanje informacija o prijavi</li>
              <li><strong>Sigurnost:</strong> CSRF zaštita</li>
            </ul>
            <p className="mb-4">
              Ne koristimo kolačiće za praćenje ili oglašavanje.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. Prenos podataka van Srbije</h2>
            <p className="mb-4">
              Vaši podaci mogu biti preneti i obrađivani u zemljama van Srbije (npr. EU, SAD)
              gde se nalaze naši pružaoci usluga. U tim slučajevima obezbeđujemo adekvatnu
              zaštitu putem standardnih ugovornih klauzula ili drugih mehanizama u skladu
              sa GDPR-om.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">11. Maloletnici</h2>
            <p className="mb-4">
              Naša platforma nije namenjena licima mlađim od 18 godina. Ne prikupljamo
              svesno podatke od maloletnika.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">12. Izmene Politike</h2>
            <p className="mb-4">
              Možemo povremeno ažurirati ovu Politiku. O značajnim izmenama ćemo vas
              obavestiti putem email-a ili obaveštenja na platformi. Nastavak korišćenja
              platforme nakon izmena smatra se prihvatanjem nove Politike.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">13. Kontakt</h2>
            <p className="mb-4">Za sva pitanja u vezi sa zaštitom podataka:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="mb-2"><strong>NKNet Consulting d.o.o.</strong></p>
              <p className="mb-2">Email: <a href="mailto:privacy@trazim-radnike.online" className="text-blue-600 hover:underline">privacy@trazim-radnike.online</a></p>
              <p>Web: <a href="https://trazim-radnike.online" className="text-blue-600 hover:underline">trazim-radnike.online</a></p>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">14. Pravo na prigovor</h2>
            <p className="mb-4">
              Imate pravo da podnesete prigovor Povereniku za informacije od javnog značaja
              i zaštitu podataka o ličnosti Republike Srbije ako smatrate da je obrada vaših
              podataka izvršena suprotno zakonu.
            </p>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Nazad na početnu stranicu
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Tražim-Radnike.online. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
}
