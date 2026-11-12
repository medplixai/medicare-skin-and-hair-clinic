============================================================
  SIGNATURE TREATMENT ఫోటోలు — ఇక్కడ పెట్టండి
  (Showcase images for the Treatments section)
============================================================

"Signature Treatments" showcase cards కి ఫోటోలు ఇక్కడ పెట్టండి.
ఫైల్ పేరు = treatment slug + .jpg (assets/js/pricing.js లో ఉంది):

   botox.jpg          → Botox & Anti-Wrinkle
   glutathione.jpg    → Glutathione IV Drip
   hydrafacial.jpg    → HydraFacial & Medifacials
   laser-hair.jpg     → Laser Hair Reduction
   hair.jpg           → GFC / PRF Hair Growth
   skin-booster.jpg   → Skin Boosters
   peels.jpg          → Chemical Peels & Cosmelan
   lasers.jpg         → Advanced Lasers

గమనికలు / Notes:
 • ఫోటో లేకపోతే అందమైన ICON ఆటోమేటిక్‌గా చూపిస్తుంది (ఏదీ పాడవ్వదు).
 • Size: ~800x600 px (landscape) బాగుంటుంది.
 • కొత్త signature treatment / slug — pricing.js లో MEDICARE_PRICING.signature లో మార్చండి.
 • ⚠️ రోగి/నిజమైన ఫోటోలు పెట్టే ముందు అనుమతి (consent) తీసుకోండి.

------------------------------------------------------------
  🖼️ ఈ ఫోటోలు మళ్ళీ గీయించాలంటే (12 నవంబర్ 2026)
------------------------------------------------------------

ఈ 8 ఫోటోలూ tools/gen-images.mjs గీస్తుంది. Prompts అక్కడే ఉన్నాయి —
అక్షరాలు లేకుండా, మనుషులు లేకుండా, పరికరాలు మాత్రమే.

   node tools/gen-images.mjs --force botox peels hair ...

⚠️ రెండు పనులు ఆ script చెయ్యదు — చేతితో చెయ్యాలి:

1) SIZE. అది ఇచ్చేది 2752x1536, quality 100, ఒక్కోటి ~2.4 MB.
   సైట్‌లో ఉండాల్సింది 960x640, quality 86, ~70 KB.
   అలాగే ఉంచి ship చేస్తే ఒక్క section కే 17 MB దిగుతుంది.

   magick <file> -gravity center -crop 2304x1536+0+0 +repage \
          -resize 960x640 -unsharp 0x0.6+0.35+0.02 -quality 86 -strip <file>

2) చూడటం. Model ఒక్కోసారి చెప్పింది వినదు — 10 నవంబర్‌న lasers.jpg
   screen మీద "FLUENCE 20 / FREQUENCY 15" అని కల్పించి రాసింది,
   prompt లో "display switched off" అని ఉన్నా. Ship చేసే ముందు
   ప్రతి ఫోటోనూ zoom చేసి చూడండి — సీసాల labels, గోడలు, screens.

3) ?v= పెంచండి (పేరు మారదు కాబట్టి browser పాతదే చూపిస్తుంది):
   • assets/js/pricing.js  → var IMG_V
   • index.html            → pricing.js script tag లో ఉన్న ?v=
     (రెండూ పెంచాలి — script పాతది వస్తే IMG_V కూడా పాతదే వస్తుంది)
