# Medicare Skin & Hair Clinic — Website

మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్ కోసం వెబ్‌సైట్. తెలుగులో, మొబైల్ & కంప్యూటర్ రెండింటిలోనూ బాగా పనిచేస్తుంది.
A single-page, Telugu-language website built from the clinic brochure. Fully responsive.

## చూడటం ఎలా / How to view

- **సులభమైన మార్గం:** `index.html` ఫైల్‌ను బ్రౌజర్‌లో డబుల్-క్లిక్ చేయండి.
- **లోకల్ సర్వర్‌తో (recommended):** టెర్మినల్‌లో ఈ ఫోల్డర్‌లో `python3 server.py` రన్ చేసి, `http://localhost:5050` తెరవండి.

> గమనిక: ఈ ఫోల్డర్ iCloud Drive లో ఉంది. Claude యాప్‌లోని "Launch" ప్రివ్యూ iCloud ఫైల్‌లను నేరుగా చదవలేదు, కాబట్టి అది `/tmp/medicare-site` లో ఒక **కాపీ**ని సర్వ్ చేస్తుంది. అసలు ఫైల్‌లు మార్చాక ప్రివ్యూ refresh చేయాలంటే ఈ ఫోల్డర్‌లో రన్ చేయండి:
> ```
> cp index.html /tmp/medicare-site/ && cp -R assets /tmp/medicare-site/
> ```
> (`python3 server.py` మరియు `index.html` డబుల్-క్లిక్ ఎప్పుడూ తాజా version చూపిస్తాయి — వాటికి ఇది అవసరం లేదు.)

## ఏమి ఉంది / Sections

హోమ్ (Hero) · మా గురించి (Why us) · వ్యాధులు (Conditions — చర్మ/జుట్టు/గోరు/పిల్లలు/...) ·
చికిత్సలు & ధరలు (12 cosmetic treatments with prices) · వైద్యులు (Doctors — నాయకత్వం + 10 కన్సల్టెంట్లు) ·
మొబైల్ యాప్ · శాఖలు (10+ శాఖల directory) · అపాయింట్‌మెంట్ ఫారం (→ WhatsApp).

**10 శాఖలు + వైద్యులు** (catalog నుండి): కైకలూరు–డా.మేఘన (HQ) · భీమవరం–డా.శృతి · గన్నవరం–డా.సాత్విక · నూజివీడు–డా.సౌమ్య · ఏలూరు–డా.సాయి నిహిత · తాడేపల్లిగూడెం–డా.అఖిల · ఒంగోలు–డా.సాయిదీప్తి · మచిలీపట్నం–డా.సుధీర్ కుమార్ · గుడివాడ–డా.ఆదిత్య · ఆకివీడు–డా.మేఘన.

## శాఖల వివరాలు ఎలా మార్చాలి / Editing branches  ⭐

అన్ని శాఖల వివరాలు **ఒకే ఫైల్‌లో** ఉన్నాయి: **`assets/js/branches.js`**.
ప్రతి శాఖకు ఈ లైన్లు మార్చండి (ఒక్కో లైన్ — చాలా సులభం):

| ఏమి / Field | ఎక్కడ / What to do |
|---|---|
| **చిరునామా** (address) | `address: ""` లో పూర్తి చిరునామా టైప్ చేయండి. ఖాళీగా ఉంటే "త్వరలో" చూపిస్తుంది. |
| **Google Map** | సాధారణంగా ఊరి పేరుతో ఆటోమేటిక్‌గా వస్తుంది. కచ్చితమైన లొకేషన్ కావాలంటే Google Maps → "Share → Embed a map" నుండి `src` లింక్‌ను `mapEmbed: ""` లో పెట్టండి. |
| **డాక్టర్ ఫోటో** | ఫోటోను `assets/img/doctors/` లో సరైన పేరుతో పెట్టండి (ఉదా. `meghana.jpg`). ఆటోమేటిక్‌గా కనిపిస్తుంది. |
| **క్లినిక్ ఫోటో** | ఫోటోను `assets/img/branches/` లో సరైన పేరుతో పెట్టండి (ఉదా. `kaikaluru.jpg`). |
| **ఫోన్ / WhatsApp** | `phones: [...]`, `whatsapp: "91..."` మార్చండి. |

ఫైల్ పేర్ల జాబితా: `assets/img/doctors/README.txt` మరియు `assets/img/branches/README.txt` లో ఉంది.
**ఫోటో/చిరునామా లేకపోతే అందమైన ప్లేస్‌హోల్డర్ ఆటోమేటిక్‌గా చూపిస్తుంది** — ఏదీ పాడవ్వదు.

## ⭐ Google Reviews live చూపించడం / Show live Google reviews

ప్రతి శాఖలో నిజమైన Google rating + reviews చూపించాలంటే **2 things** కావాలి. వాటిని `assets/js/branches.js` పైభాగంలో `window.MEDICARE_REVIEWS` లో పెట్టండి:

1. **API key** — [Google Cloud Console](https://console.cloud.google.com/) లో project create చేసి, **"Maps JavaScript API"** + **"Places API (New)"** enable చేసి, ఒక API key తీసుకోండి. ఆ key ను మీ website domain కు **restrict** చేయండి (HTTP referrers). దాన్ని `apiKey: "..."` లో పెట్టండి.
2. **Place ID** (ప్రతి శాఖకు) — [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) లో మీ clinic వెతికి, లేదా Google Business Profile నుండి తీసుకుని, `placeIds` లో సరైన ఊరి పక్కన పెట్టండి (ఉదా. `kaikaluru: "ChIJ..."`).

పెట్టగానే — rating (⭐ 4.8), reviews (పేరు + comment + t"తేదీ) ఆటోమేటిక్‌గా అప్‌డేట్ అవుతూ కనిపిస్తాయి. **పెట్టకపోతే** ప్రతి శాఖలో "Google Reviews చూడండి" button కనిపిస్తుంది (live Google listing తెరుస్తుంది).

## ఇంకా కావలసినవి / Still to provide

1. **కైకలూరు పూర్తి చిరునామా** (ప్రధాన కార్యాలయం) — ఇంకా placeholder; శాఖ-వారీ చిరునామాలు (ప్రస్తుతం భీమవరం మాత్రమే).
2. **డా. సాత్విక ఫోటో** → `assets/img/doctors/satvika.jpg` (గన్నవరం 2వ డాక్టర్ — ప్రస్తుతం initial).
3. **App Store / Google Play లింక్‌లు** (ప్రస్తుతం `#`).
4. **అసలు website domain** — JSON-LD / og / canonical లో `www.medicareskinhairclinic.com` placeholder ను మార్చండి.
5. **Google API key + Place IDs** — live reviews కోసం (పైన చూడండి).

## ఫైల్‌లు / Files

```
index.html              — పేజీ మొత్తం (Telugu content)
assets/js/branches.js   — ⭐ అన్ని శాఖల డేటా (address, map, photo, doctor) — ఇక్కడ మార్చండి
assets/js/main.js       — మెను, యానిమేషన్, బుకింగ్ → WhatsApp, డాక్టర్ ఫోటో
assets/js/reviews.js    — ⭐ Google live reviews (config branches.js లో MEDICARE_REVIEWS)
assets/css/style.css    — డిజైన్ (brand pink #E860A8)
assets/img/doctors/     — డాక్టర్ ఫోటోలు ఇక్కడ
assets/img/branches/    — క్లినిక్ ఫోటోలు ఇక్కడ
server.py               — లోకల్ ప్రివ్యూ సర్వర్
```
