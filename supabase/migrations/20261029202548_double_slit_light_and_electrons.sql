-- Double slit: choose light (an electromagnetic wave) or electrons (de Broglie waves), with a
-- slit width so the pattern has its single-slit envelope. Replaces the old parameters
-- (slit_separation in nm, no width); runs saved with `slit_separation` keep the old model in the
-- engine. `visible_when` shows wavelength only for light and the voltage only for electrons.
update public.experiment_templates
set
  parameters = '[
  {
    "key": "source",
    "type": "select",
    "unit": "",
    "default": "light",
    "options": [
      {
        "value": "light",
        "label_he": "גל אלקטרומגנטי (אור)",
        "label_en": "Electromagnetic wave (light)"
      },
      {
        "value": "electron",
        "label_he": "אלקטרונים",
        "label_en": "Electrons"
      }
    ],
    "i18n_labels": {
      "he": "מה עובר דרך הסדקים",
      "en": "What goes through the slits"
    },
    "tooltip": {
      "he": "אור הוא גל אלקטרומגנטי. גם לאלקטרונים, שהם חלקיקי חומר, יש אורך גל (אורך הגל של דה־ברויי), ולכן גם הם יוצרים פסי התאבכות.",
      "en": "Light is an electromagnetic wave. Electrons are particles of matter, yet they also have a wavelength (the de Broglie wavelength), so they form interference fringes too."
    },
    "is_active": true
  },
  {
    "key": "wavelength",
    "type": "float",
    "unit": "nm",
    "default": "532",
    "min": "380",
    "max": "750",
    "step": "1",
    "options": [],
    "i18n_labels": {
      "he": "אורך גל",
      "en": "Wavelength"
    },
    "tooltip": {
      "he": "קובע את צבע האור: כ־400 ננומטר סגול, כ־650 ננומטר אדום. אורך גל ארוך יותר מרחיק את הפסים זה מזה.",
      "en": "Sets the colour of the light: about 400 nm is violet, about 650 nm is red. A longer wavelength spreads the fringes further apart."
    },
    "visible_when": {
      "key": "source",
      "equals": "light"
    },
    "is_active": true
  },
  {
    "key": "accelerating_voltage",
    "type": "float",
    "unit": "kV",
    "default": "50",
    "min": "0.05",
    "max": "200",
    "step": "0.05",
    "options": [],
    "i18n_labels": {
      "he": "מתח האצה",
      "en": "Accelerating voltage"
    },
    "tooltip": {
      "he": "המתח שמאיץ את האלקטרונים. אלקטרון מהיר יותר הוא בעל תנע גדול יותר ואורך גל קצר יותר (λ = h/p), ולכן הפסים מתקרבים.",
      "en": "The voltage that accelerates the electrons. A faster electron has more momentum and a shorter wavelength (λ = h/p), so the fringes move closer together."
    },
    "visible_when": {
      "key": "source",
      "equals": "electron"
    },
    "is_active": true
  },
  {
    "key": "slit_spacing",
    "type": "float",
    "unit": "µm",
    "default": "250",
    "min": "0.1",
    "max": "2000",
    "step": "0.1",
    "options": [],
    "i18n_labels": {
      "he": "מרחק בין מרכזי הסדקים",
      "en": "Slit spacing (centre to centre)"
    },
    "tooltip": {
      "he": "ככל שהסדקים רחוקים יותר זה מזה, הפסים על המסך צפופים יותר. 1000 מיקרומטר = 1 מילימטר.",
      "en": "The further apart the slits, the closer together the fringes on the screen. 1000 µm = 1 mm."
    },
    "is_active": true
  },
  {
    "key": "slit_width",
    "type": "float",
    "unit": "µm",
    "default": "50",
    "min": "0.05",
    "max": "500",
    "step": "0.05",
    "options": [],
    "i18n_labels": {
      "he": "רוחב כל סדק",
      "en": "Width of each slit"
    },
    "tooltip": {
      "he": "סדק צר מפזר את הגל לזווית רחבה יותר, כך שרואים יותר פסים. הרוחב חייב להיות קטן מהמרחק בין הסדקים.",
      "en": "A narrow slit spreads the wave over a wider angle, so more fringes show. The width must be smaller than the slit spacing."
    },
    "is_active": true
  },
  {
    "key": "screen_distance",
    "type": "float",
    "unit": "m",
    "default": "1",
    "min": "0.1",
    "max": "5",
    "step": "0.1",
    "options": [],
    "i18n_labels": {
      "he": "מרחק הסדקים מהמסך",
      "en": "Distance from the slits to the screen"
    },
    "tooltip": {
      "he": "מסך רחוק יותר מגדיל את דגם ההתאבכות כולו.",
      "en": "A more distant screen enlarges the whole pattern."
    },
    "is_active": true
  }
]'::jsonb,
  presets = '[
  {
    "name_he": "לייזר ירוק",
    "name_en": "Green laser",
    "values": {
      "source": "light",
      "wavelength": 532,
      "slit_spacing": 250,
      "slit_width": 50,
      "screen_distance": 1
    }
  },
  {
    "name_he": "לייזר אדום",
    "name_en": "Red laser",
    "values": {
      "source": "light",
      "wavelength": 650,
      "slit_spacing": 250,
      "slit_width": 50,
      "screen_distance": 1
    }
  },
  {
    "name_he": "אלומת אלקטרונים, 50 קילו־וולט",
    "name_en": "Electron beam, 50 kV",
    "values": {
      "source": "electron",
      "accelerating_voltage": 50,
      "slit_spacing": 1,
      "slit_width": 0.2,
      "screen_distance": 1
    }
  },
  {
    "name_he": "אלקטרונים איטיים, 100 וולט",
    "name_en": "Slow electrons, 100 V",
    "values": {
      "source": "electron",
      "accelerating_voltage": 0.1,
      "slit_spacing": 1,
      "slit_width": 0.2,
      "screen_distance": 1
    }
  }
]'::jsonb,
  i18n_texts = '{
  "he": {
    "title": "ניסוי שני הסדקים",
    "short_desc": "שלחו אור או אלקטרונים דרך שני סדקים וצפו בדגם ההתאבכות שנוצר: הטבע הגלי של האור ושל החומר.",
    "steps": [
      "בחרו מה עובר דרך הסדקים: אור או אלקטרונים",
      "שנו את המרחק בין הסדקים, את רוחבם ואת המרחק למסך",
      "צפו בפסים על המסך, ובאלקטרונים שמגיעים אחד אחד ובונים אותם"
    ],
    "safety_notes": ""
  },
  "en": {
    "title": "Double Slit",
    "short_desc": "Send light or electrons through two slits and watch the interference pattern form: the wave nature of light and of matter.",
    "steps": [
      "Choose what goes through the slits: light or electrons",
      "Change the slit spacing, the slit width and the screen distance",
      "Watch the fringes on the screen, and the electrons that arrive one by one and build them up"
    ],
    "safety_notes": ""
  }
}'::jsonb,
  tags = '["optics", "waves", "quantum"]'::jsonb
where slug = 'double-slit';
