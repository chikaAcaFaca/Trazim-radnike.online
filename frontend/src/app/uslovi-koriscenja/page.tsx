import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Uslovi korišćenja',
  description: 'Uslovi korišćenja platforme Tražim-Radnike.online',
};

export default function TermsOfServicePage() {
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
            Uslovi korišćenja
          </h1>

          <p className="text-sm text-gray-500 mb-8">
            Poslednja izmena: {new Date().toLocaleDateString('sr-RS')}
          </p>

          <div className="prose prose-blue max-w-none">
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Opšte odredbe</h2>
            <p className="mb-4">
              Ovi Uslovi korišćenja (u daljem tekstu: "Uslovi") regulišu korišćenje web platforme
              Tražim-Radnike.online (u daljem tekstu: "Platforma") koju vodi kompanija NKNet Consulting d.o.o.
              (u daljem tekstu: "mi", "naš", "Pružalac usluga").
            </p>
            <p className="mb-4">
              Korišćenjem Platforme prihvatate ove Uslove u celosti. Ako se ne slažete sa bilo
              kojim delom Uslova, molimo vas da ne koristite Platformu.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Važno obaveštenje</h3>
              <p className="text-yellow-700">
                <strong>Mi smo KONSULTANTSKA AGENCIJA, a NE agencija za zapošljavanje.</strong> Ne posedujemo
                licencu za posredovanje u zapošljavanju i ne vršimo regrutaciju radnika. Naše usluge
                obuhvataju isključivo konsultacije u vezi sa pripremom dokumentacije za zapošljavanje
                i savete o procedurama.
              </p>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Opis usluga</h2>
            <p className="mb-4">Platforma pruža sledeće usluge:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Konsultacije o dokumentaciji:</strong> Pomoć u pripremi potrebne dokumentacije za zapošljavanje radnika</li>
              <li><strong>Saveti o procedurama:</strong> Informacije o pravnim procedurama za međunarodno zapošljavanje</li>
              <li><strong>Asistencija pri formularima:</strong> Pomoć pri popunjavanju i verifikaciji potrebnih obrazaca</li>
              <li><strong>AI asistent:</strong> Automatizovani chatbot za prikupljanje informacija o potrebama klijenta</li>
            </ul>
            <p className="mb-4">
              <strong>Mi NE:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Pronalazimo radnike za klijente</li>
              <li>Šaljemo predloge kandidata</li>
              <li>Delujemo kao posrednik između radnika i poslodavaca</li>
              <li>Zapošljavamo ili regrutujemo radnike u ime klijenata</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Registracija i nalog</h2>
            <p className="mb-4">
              Za korišćenje pojedinih funkcionalnosti Platforme potrebna je registracija.
              Pri registraciji se obavezujete da:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Navedete tačne i potpune podatke</li>
              <li>Ažurirate podatke ako dođe do promene</li>
              <li>Čuvate poverljivost lozinke</li>
              <li>Ne delite pristup nalogu sa trećim licima</li>
              <li>Odmah nas obavestite o neovlašćenom pristupu</li>
            </ul>
            <p className="mb-4">
              Zadržavamo pravo da odbijemo registraciju ili ukinemo nalog bez obrazloženja.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Obaveze korisnika</h2>
            <p className="mb-4">Kao korisnik Platforme, obavezujete se da:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Koristite Platformu u skladu sa zakonom i ovim Uslovima</li>
              <li>Ne objavljujete lažne ili obmanjujuće informacije</li>
              <li>Ne koristite Platformu za nezakonite aktivnosti</li>
              <li>Ne pokušavate da pristupite tuđim nalozima</li>
              <li>Ne ometate rad Platforme</li>
              <li>Ne prikupljate podatke drugih korisnika bez dozvole</li>
              <li>Ne širite viruse ili zlonamerni softver</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Oglasi i sadržaj</h2>
            <p className="mb-4">
              Korisnici mogu objavljivati oglase za potrebe konsultacija. Za sav objavljeni
              sadržaj odgovorni ste vi. Zabranjeno je objavljivanje:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Sadržaja koji krši zakon</li>
              <li>Diskriminatornog sadržaja</li>
              <li>Sadržaja koji obmanjuje ili dovodi u zabludu</li>
              <li>Ponuda za nelegalne poslove</li>
              <li>Ličnih dokumenata (pasoš, lična karta, itd.)</li>
              <li>Finansijskih podataka (brojevi kartica, itd.)</li>
            </ul>
            <p className="mb-4">
              Zadržavamo pravo da uklonimo sadržaj koji krši ove Uslove bez prethodnog obaveštenja.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Tajni linkovi</h2>
            <p className="mb-4">
              Oglasi mogu imati "tajne linkove" koji omogućavaju pristup punim detaljima.
              Ako podelite tajni link:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Odgovorni ste za kontrolu pristupa</li>
              <li>Link možete resetovati u bilo kom trenutku</li>
              <li>Stari link prestaje da radi nakon resetovanja</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Intelektualna svojina</h2>
            <p className="mb-4">
              Platforma, uključujući dizajn, kod, logo i sadržaj, zaštićena je autorskim
              pravima i drugim pravima intelektualne svojine. Zabranjeno je:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Kopiranje ili reprodukcija Platforme</li>
              <li>Korišćenje logoa bez dozvole</li>
              <li>Pravljenje derivativnih radova</li>
              <li>"Scraping" ili automatsko preuzimanje podataka</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Ograničenje odgovornosti</h2>
            <p className="mb-4">
              Platforma se pruža "kakva jeste" bez bilo kakvih garancija. Ne garantujemo:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Neprekidno i bez grešaka funkcionisanje</li>
              <li>Tačnost informacija koje pružaju korisnici</li>
              <li>Rezultate korišćenja naših konsultantskih usluga</li>
              <li>Sigurnost od svih sajber pretnji</li>
            </ul>
            <p className="mb-4">
              U maksimalnoj meri dozvoljenoj zakonom, ne snosimo odgovornost za:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Indirektne, posledične ili kaznene štete</li>
              <li>Gubitak profita ili poslovnih prilika</li>
              <li>Štetu nastalu od trećih lica</li>
              <li>Štetu usled neovlašćenog pristupa vašem nalogu</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Naknada štete</h2>
            <p className="mb-4">
              Obavezujete se da nas oslobodite odgovornosti i nadoknadite bilo kakvu štetu,
              troškove i izdatke (uključujući advokatske honorare) nastale usled:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Kršenja ovih Uslova</li>
              <li>Kršenja prava trećih lica</li>
              <li>Vašeg sadržaja objavljenog na Platformi</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. Privatnost</h2>
            <p className="mb-4">
              Vaše lične podatke obrađujemo u skladu sa našom{' '}
              <Link href="/politika-privatnosti" className="text-blue-600 hover:underline">
                Politikom privatnosti
              </Link>
              , koja je sastavni deo ovih Uslova.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">11. Izmene Uslova</h2>
            <p className="mb-4">
              Zadržavamo pravo da izmenimo ove Uslove u bilo kom trenutku. O značajnim
              izmenama ćemo vas obavestiti putem email-a ili obaveštenja na Platformi.
              Nastavak korišćenja Platforme nakon izmena smatra se prihvatanjem novih Uslova.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">12. Raskid</h2>
            <p className="mb-4">
              Možete prestati da koristite Platformu u bilo kom trenutku brisanjem naloga.
              Mi možemo ukinuti vaš nalog ili pristup Platformi ako:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Prekršite ove Uslove</li>
              <li>Postupate na način koji može da nam nanese štetu</li>
              <li>Ne koristite nalog duže od 12 meseci</li>
              <li>Iz bilo kog drugog razloga, uz prethodno obaveštenje</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">13. Merodavno pravo i sporovi</h2>
            <p className="mb-4">
              Ovi Uslovi se tumače u skladu sa zakonima Republike Srbije. Za sve sporove
              nadležan je sud u Beogradu, Republika Srbija.
            </p>
            <p className="mb-4">
              Pre pokretanja spora, obavezujete se da pokušate da ga rešite mirnim putem
              kontaktiranjem naše korisničke podrške.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">14. Odvojivost</h2>
            <p className="mb-4">
              Ako se bilo koja odredba ovih Uslova proglasi nevažećom ili neizvršivom,
              preostale odredbe ostaju na snazi.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">15. Celokupni sporazum</h2>
            <p className="mb-4">
              Ovi Uslovi, zajedno sa Politikom privatnosti, čine celokupni sporazum između
              vas i nas u vezi sa korišćenjem Platforme.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">16. Kontakt</h2>
            <p className="mb-4">Za sva pitanja u vezi sa ovim Uslovima:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="mb-2"><strong>NKNet Consulting d.o.o.</strong></p>
              <p className="mb-2">Email: <a href="mailto:info@trazim-radnike.online" className="text-blue-600 hover:underline">info@trazim-radnike.online</a></p>
              <p>Web: <a href="https://trazim-radnike.online" className="text-blue-600 hover:underline">trazim-radnike.online</a></p>
            </div>
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
