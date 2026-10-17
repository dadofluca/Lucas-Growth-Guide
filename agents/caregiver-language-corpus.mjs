/** Synthetic caregiver-language corpus; never sourced from real family messages. */
export const caregiverPhrases=Object.freeze([
 {input:"gave him 8oz at 9:15",expected:["bottle"],note:"time + amount"},
 {input:"he drank 6 ounces",expected:["bottle"],note:"unit variant"},
 {input:"7 oz bottle and wet diaper",expected:["bottle","pee"],note:"multi-event"},
 {input:"big poop and 4oz",expected:["poop","bottle"],note:"implicit feeding"},
 {input:"pee pee",expected:["pee"],note:"colloquial"},
 {input:"changed his diaper",expected:[],note:"ambiguous wet/dirty: must clarify"},
 {input:"fed him",expected:[],note:"missing amount/type: must clarify"},
 {input:"bottle 80z",expected:[],note:"zero-for-letter typo: ask, never assume"},
 {input:"he slept from 10:30 to 12:40",expected:["nap"],note:"time range"},
 {input:"nap at 10",expected:["nap"],note:"missing end: open-ended or clarify"},
 {input:"low on formula",expected:["supply"],note:"supply alert not bottle"},
 {input:"gave 8 oz yesterday at 8:30",expected:["bottle"],note:"relative date"},
 {input:"Nona gave him 5 oz",expected:["bottle"],note:"caregiver attribution"},
 {input:"Boppa fed him - Nona",expected:[],note:"conflicting caregiver: clarify"},
 {input:"8 ounces and another 8 ounces",expected:["bottle","bottle"],note:"two events, not silent merge"},
 {input:"8 oz",expected:["bottle"],note:"no auto-save without confirmation"},
 {input:"gave him medicine",expected:["medicine"],note:"must clarify medicine and dose"},
 {input:"some solids and then poop",expected:["solids","poop"],note:"two distinct events"}
]);
