'use strict';
window.DATA = {
  phases: [
    { to: 2, name: 'A0 — شروع امن', focus: 'الفبا، صداها، سلام‌واحوال‌پرسی، اعداد و جمله‌های خیلی کوتاه.' },
    { to: 5, name: 'A1 — زندگی روزمره', focus: 'معرفی، خانواده، خرید، زمان، افعال پایه و ترتیب جمله.' },
    { to: 9, name: 'A2 — استقلال اولیه', focus: 'گذشته، قرارها، سفر، سلامت، افعال جداشدنی و Akkusativ/Dativ.' },
    { to: 14, name: 'B1 — ارتباط مستقل', focus: 'روایت، نظر دادن، نامه رسمی، جمله‌های وابسته و آمادگی Goethe B1.' },
    { to: 19, name: 'B2 — استدلال و دقت', focus: 'بحث ساختاریافته، متن واقعی، واژگان موضوعی و آمادگی Goethe B2.' },
    { to: 24, name: 'C1 — زبان دانشگاهی و حرفه‌ای', focus: 'بیان دقیق و طبیعی، متن پیچیده، ارائه و شبیه‌سازی Goethe/telc C1.' }
  ],
  diag: [
    {l:'A1',s:'Ich ___ Sara.',o:['heiße','heißt','heißen','bin heißen'],a:0},{l:'A1',s:'Das ist ___ Buch.',o:['ein','eine','einen','einem'],a:0},{l:'A1',s:'Wo ___ du?',o:['wohnst','wohnt','wohnen','wohne'],a:0},{l:'A1',s:'Ich komme ___ Iran.',o:['aus dem','von den','in die','bei'],a:0},
    {l:'A2',s:'Gestern ___ ich lange gearbeitet.',o:['habe','bin','werde','hatte'],a:0},{l:'A2',s:'Kannst du ___ bitte helfen?',o:['mir','mich','ich','mein'],a:0},{l:'A2',s:'Ich interessiere mich ___ Musik.',o:['für','mit','an','zu'],a:0},{l:'A2',s:'Der Zug fährt um acht Uhr ___.',o:['ab','aus','an','ein'],a:0},
    {l:'B1',s:'Wenn ich Zeit hätte, ___ ich mehr lesen.',o:['würde','werde','will','wurde'],a:0},{l:'B1',s:'Obwohl es regnete, ___ wir spazieren.',o:['gingen','gehen','gegangen','würden'],a:0},{l:'B1',s:'Das ist die Frau, ___ Sohn in Berlin studiert.',o:['deren','dessen','der','denen'],a:0},{l:'B1',s:'Ich freue mich darauf, dich bald ___.',o:['zu sehen','sehen','gesehen','sah'],a:0},
    {l:'B2',s:'Je mehr man übt, ___ sicherer spricht man.',o:['desto','deshalb','trotzdem','während'],a:0},{l:'B2',s:'Die Aufgabe muss bis morgen erledigt ___.',o:['werden','sein','haben','worden'],a:0},{l:'B2',s:'Er tat so, als ___ er alles.',o:['wüsste','weiß','wusste','wissen'],a:0},{l:'B2',s:'Die Maßnahmen zielen ___, den Verkehr zu reduzieren.',o:['darauf ab','daran','damit','davon aus'],a:0},
    {l:'C1',s:'Die Ergebnisse sind mit Vorsicht ___.',o:['zu interpretieren','interpretiert','interpretieren','zu interpretierte'],a:0},{l:'C1',s:'___ der hohen Kosten wurde das Projekt genehmigt.',o:['Ungeachtet','Während','Indem','Zufolge'],a:0},{l:'C1',s:'Seine Aussage steht im Widerspruch ___ den Daten.',o:['zu','für','über','gegenüber von'],a:0},{l:'C1',s:'Kaum ___ die Sitzung begonnen, kam es zum Streit.',o:['hatte','hat','wurde','würde'],a:0}
  ],
  gramCats: {basics:'پایه: sein، haben و صرف فعل',wordorder:'جایگاه فعل و ترتیب جمله',cases:'حالت‌ها و آرتیکل‌ها',modal:'افعال مدال و جداشدنی',past:'گذشته Perfekt/Präteritum',subordinate:'جمله وابسته و ربط‌دهنده‌ها',adjective:'صرف صفت',advanced:'ساختارهای B2–C1'},
  gram: [
    {c:'basics',s:'Ich ___ müde.',o:['bin','bist','ist'],a:0,e:'برای ich، فعل sein به صورت bin صرف می‌شود.'},{c:'basics',s:'Wir ___ zwei Kinder.',o:['haben','habt','hat'],a:0,e:'برای wir، شکل haben است.'},{c:'basics',s:'Er ___ jeden Tag Deutsch.',o:['lernt','lerne','lernen'],a:0,e:'برای er/sie/es معمولاً پسوند -t می‌آید.'},
    {c:'wordorder',s:'Heute ___ ich zu Hause.',o:['arbeite','ich arbeite','arbeitet'],a:0,e:'در جمله اصلی فعل صرف‌شده همیشه جایگاه دوم است.'},{c:'wordorder',s:'Morgen möchte ich ins Kino ___.',o:['gehen','gehe','gegangen'],a:0,e:'با فعل مدال، مصدر در انتهای جمله قرار می‌گیرد.'},{c:'wordorder',s:'Wann ___ der Kurs an?',o:['fängt','der Kurs fängt','anfängt'],a:0,e:'در پرسش W، فعل صرف‌شده بعد از کلمه پرسشی می‌آید.'},
    {c:'cases',s:'Ich sehe ___ Mann.',o:['den','der','dem'],a:0,e:'مفعول مستقیم مذکر در Akkusativ: den.'},{c:'cases',s:'Ich helfe ___ Frau.',o:['der','die','den'],a:0,e:'helfen همیشه Dativ می‌گیرد: der Frau.'},{c:'cases',s:'Das Geschenk ist für ___ Kind.',o:['das','dem','des'],a:0,e:'حرف اضافه für همیشه Akkusativ می‌گیرد.'},
    {c:'modal',s:'Du ___ hier nicht rauchen.',o:['darfst','kannst zu','darf'],a:0,e:'dürfen برای du: darfst؛ مصدر در پایان.'},{c:'modal',s:'Ich ___ um sechs Uhr auf.',o:['stehe','aufstehe','steht'],a:0,e:'در جمله اصلی پیشوند فعل جداشدنی به انتها می‌رود.'},
    {c:'past',s:'Wir sind nach Berlin ___.',o:['gefahren','gefahrt','fahren'],a:0,e:'حرکت/تغییر مکان معمولاً Perfekt با sein می‌سازد.'},{c:'past',s:'Sie hat das Essen ___.',o:['gekocht','gekochen','kocht'],a:0,e:'Partizip II فعل kochen برابر gekocht است.'},
    {c:'subordinate',s:'Ich bleibe zu Hause, weil ich krank ___.',o:['bin','ich bin','sein'],a:0,e:'در جمله وابسته با weil فعل صرف‌شده به انتها می‌رود.'},{c:'subordinate',s:'___ es regnet, gehen wir spazieren.',o:['Obwohl','Weil','Dass'],a:0,e:'obwohl تضاد می‌سازد: با وجود باران.'},
    {c:'adjective',s:'Das ist ein ___ Film.',o:['guter','gute','guten'],a:0,e:'بعد از ein در Nominativ مذکر: guter.'},{c:'adjective',s:'Ich trinke einen ___ Kaffee.',o:['heißen','heißer','heiße'],a:0,e:'Akkusativ مذکر بعد از einen: -en.'},
    {c:'advanced',s:'Das Problem lässt sich leicht ___.',o:['lösen','gelöst','zu lösen'],a:0,e:'ساختار lassen + sich + مصدر، امکان‌پذیری را بیان می‌کند.'},{c:'advanced',s:'Anstatt sich zu beschweren, ___ er handeln.',o:['sollte','würde zu','hat'],a:0,e:'anstatt ... zu برای جایگزینی یک عمل به کار می‌رود.'},{c:'advanced',s:'Die Studie, ___ Ergebnisse veröffentlicht wurden, ist umstritten.',o:['deren','dessen','denen'],a:0,e:'ضمیر موصولی ملکی برای Studie مؤنث: deren.'}
  ],
  deck: [
    {id:'d01',f:'Guten ___! Wie geht es Ihnen?',h:'روز بخیر',b:'Tag'},{id:'d02',f:'Ich hätte gern ___ Kaffee.',h:'یک قهوه می‌خواهم',b:'einen'},{id:'d03',f:'Wie viel ___ das?',h:'قیمتش چقدر است؟',b:'kostet'},{id:'d04',f:'Können Sie das bitte ___?',h:'تکرار کردن',b:'wiederholen'},{id:'d05',f:'Ich verstehe das ___.',h:'متوجه نمی‌شوم',b:'nicht'},
    {id:'d06',f:'Wo befindet sich der ___?',h:'ایستگاه قطار',b:'Bahnhof'},{id:'d07',f:'Ich möchte einen Termin ___.',h:'قرار گذاشتن',b:'vereinbaren'},{id:'d08',f:'Das kommt darauf ___.',h:'بستگی دارد',b:'an'},{id:'d09',f:'Meiner ___ nach ist das sinnvoll.',h:'به نظر من',b:'Meinung'},{id:'d10',f:'Einerseits ist es praktisch, ___ ist es teuer.',h:'از طرف دیگر',b:'andererseits'},
    {id:'d11',f:'Ich bin damit nicht ganz ___.',h:'کاملاً موافق نیستم',b:'einverstanden'},{id:'d12',f:'Das spielt eine entscheidende ___.',h:'نقش تعیین‌کننده',b:'Rolle'},{id:'d13',f:'Wir sollten die Vor- und Nachteile ___.',h:'سبک‌سنگین کردن',b:'abwägen'},{id:'d14',f:'Die Daten deuten darauf ___.',h:'داده‌ها نشان می‌دهند',b:'hin'},{id:'d15',f:'Das steht im ___ zu den Ergebnissen.',h:'در تضاد با',b:'Widerspruch'},
    {id:'d16',f:'Zusammenfassend lässt sich ___.',h:'در جمع‌بندی می‌توان گفت',b:'sagen'},{id:'d17',f:'Ich verfüge über gute Deutsch___.',h:'دانش زبان آلمانی',b:'kenntnisse'},{id:'d18',f:'Vielen Dank im ___ für Ihre Hilfe.',h:'پیشاپیش',b:'Voraus'},{id:'d19',f:'Ich freue mich auf Ihre ___.',h:'پاسخ شما',b:'Rückmeldung'},{id:'d20',f:'Es handelt sich ___ ein Missverständnis.',h:'موضوع ... است',b:'um'}
  ],
  shadow: [
    {id:'alphabet',t:'صداهای پایه و اوملاوت',n:'آهسته گوش کن، همراه صدا و سپس بدون کمک تکرار کن.',items:[{s:'Müller, München und fünf Bücher.',m:'برای ü لب‌ها گرد و زبان در جایگاه i است.'},{s:'Schöne Grüße aus Köln.',m:'ö را با لب گرد و زبان e بساز.'},{s:'Äpfel, Käse und spät.',m:'ä اغلب شبیه e باز شنیده می‌شود.'},{s:'Ich spreche ein bisschen Deutsch.',m:'ch در ich نرم و جلوی دهان است.'}]},
    {id:'rhythm',t:'ریتم و تکیهٔ جمله',n:'کلمه‌های محتوایی را برجسته و بخش‌های دستوری را سبک‌تر بگو.',items:[{s:'Ich fahre morgen mit dem Zug nach Berlin.',m:'تکیه‌ها: FAH–ZUG–BER'},{s:'Könnten Sie das bitte noch einmal wiederholen?',m:'لحن مؤدبانه و پیوسته؛ پایان کمی بالا.'},{s:'Einerseits ist es praktisch, andererseits ziemlich teuer.',m:'دو بخش متقابل را با مکث کوتاه جدا کن.'},{s:'Zusammenfassend lässt sich sagen, dass die Vorteile überwiegen.',m:'sagen و überwiegen را برجسته کن.'}]}
  ],
  pairs: [
    {id:'uo',t:'ü / u',n:'برای ü لب گرد است اما زبان جلو می‌ماند.',p:[['füllen','fühlen'],['Hütte','Hüte'],['müssen','Muse']]},
    {id:'ichach',t:'ich-Laut / ach-Laut',n:'بعد از واکه جلویی ch نرم و بعد از a/o/u خشن‌تر است.',p:[['ich','ach'],['Licht','lacht'],['möchte','machen']]},
    {id:'longshort',t:'واکه کوتاه / بلند',n:'طول واکه در آلمانی می‌تواند معنا را عوض کند.',p:[['Stadt','Staat'],['bitten','bieten'],['offen','Ofen']]}
  ],
  part1: [
    {t:'A1 · معرفی',q:['Wie heißen Sie?','Woher kommen Sie?','Wo wohnen Sie?','Welche Sprachen sprechen Sie?']},
    {t:'A2 · روزمره',q:['Wie sieht Ihr normaler Tag aus?','Was machen Sie am Wochenende?','Wie lernen Sie Deutsch?','Was haben Sie gestern gemacht?']},
    {t:'B1 · تجربه',q:['Warum lernen Sie Deutsch?','Erzählen Sie von einer wichtigen Reise.','Was möchten Sie beruflich erreichen?','Welche Gewohnheit möchten Sie ändern?']},
    {t:'B2/C1 · نظر',q:['Welche Rolle spielt Technologie beim Lernen?','Sollte Homeoffice ein Recht sein?','Wie verändert Migration eine Gesellschaft?','Was bedeutet Lebensqualität für Sie?']}
  ],
  cards: [
    {id:'k01',t:'Beschreiben Sie einen typischen Tag.',b:['Tagesablauf','Arbeit oder Studium','Freizeit','was Sie ändern möchten'],p3:['Warum sind Routinen hilfreich?','Wie hat sich der Alltag verändert?','Welche Rolle spielt Zeitmanagement?']},
    {id:'k02',t:'Berichten Sie über ein wichtiges Lernerlebnis.',b:['wann und wo','was Sie gelernt haben','welche Schwierigkeiten es gab','warum es wichtig war'],p3:['Wie lernt man als Erwachsener?','Sind Fehler nützlich?','Welche Verantwortung haben Schulen?']},
    {id:'k03',t:'Nehmen Sie Stellung zum Thema soziale Medien.',b:['eigene Erfahrung','Vorteile','Nachteile','Ihre Empfehlung'],p3:['Brauchen wir strengere Regeln?','Wie beeinflussen Algorithmen Meinungen?','Was bedeutet digitale Kompetenz?']}
  ],
  bench:{id:'bench',t:'Stellen Sie sich vor und erklären Sie ausführlich, warum Sie Deutsch lernen.',b:['persönlicher Hintergrund','Ziele','bisherige Erfahrung','Plan für die nächsten Monate']},
  patient:[{id:'r1',t:'Sie sind neu in Berlin. Fragen Sie höflich nach dem Weg zum Bürgeramt und klären Sie Öffnungszeiten und Dokumente.'},{id:'r2',t:'Sie haben ein Problem mit einer Online-Bestellung. Erklären Sie das Problem und verhandeln Sie eine Lösung.'},{id:'r3',t:'Sie präsentieren im Team einen Vorschlag für flexiblere Arbeitszeiten und reagieren auf Einwände.'}],
  selfcheck:['بیش از دو ثانیه مکث داشتم','جایگاه فعل را اشتباه کردم','آرتیکل یا حالت اسم اشتباه بود','واژگانم تکراری بود','منظورم را کامل و منظم منتقل کردم'],
  writing: [
    {id:'diag',k:'essay',t:'Schreiben Sie über Ihre Motivation, Deutsch zu lernen, Ihre bisherigen Erfahrungen und Ihre Ziele. Begründen Sie Ihre Aussagen.'},
    {id:'w01',k:'email',t:'Sie können an einem Deutschkurs nicht teilnehmen. Schreiben Sie der Kursleitung: Grund, Entschuldigung, Frage nach Material und Vorschlag.'},
    {id:'w02',k:'email',t:'Sie haben in einer Ferienwohnung mehrere Probleme. Schreiben Sie eine formelle Beschwerde und fordern Sie eine angemessene Lösung.'},
    {id:'w03',k:'essay',t:'Sollten öffentliche Verkehrsmittel in Großstädten kostenlos sein? Nehmen Sie Stellung und nennen Sie Beispiele.'},
    {id:'w04',k:'essay',t:'Künstliche Intelligenz verändert Bildung und Arbeit. Diskutieren Sie Chancen und Risiken und formulieren Sie ein Fazit.'},
    {id:'w05',k:'summary',t:'Fassen Sie einen aktuellen deutschsprachigen Artikel in 120–150 Wörtern zusammen und trennen Sie Fakten klar von Ihrer Meinung.'}
  ],
  writeKinds:{email:{t:'ایمیل رسمی/نیمه‌رسمی',min:20,words:100},essay:{t:'متن استدلالی B1–C1',min:40,words:200},summary:{t:'خلاصه و واکنش',min:30,words:150}},
  ai: [
    {t:'مربی مکالمه A0–A2',p:'Du bist ein geduldiger Deutschlehrer. Sprich langsam auf A1-Niveau und stelle immer nur eine Frage. Erkläre schwierige Wörter kurz auf Persisch. Korrigiere nach jeder Antwort nur den wichtigsten Fehler und lass mich die richtige Version wiederholen.'},
    {t:'مربی مکالمه B1–B2',p:'Du bist mein Deutsch-Coach. Führe mit mir ein natürliches Gespräch auf B1/B2-Niveau. Stelle Rückfragen. Unterbrich mich nicht; sammle Fehler und gib nach jeweils fünf Minuten Feedback zu Wortstellung, Kasus, Wortschatz und Natürlichkeit.'},
    {t:'آزمون شفاهی C1',p:'Simuliere eine anspruchsvolle mündliche Goethe/telc-C1-Prüfung. Gib mir eine Präsentationsaufgabe, zwei Minuten Vorbereitungszeit und danach eine Diskussion. Bewerte Inhalt, Struktur, Wortschatz, Grammatik, Interaktion und Verständlichkeit. Weise darauf hin, dass dies nur eine Übung und keine offizielle Bewertung ist.'}
  ],
  listen: [{t:'DW — Nicos Weg',n:'دوره رایگان A1 تا B1؛ هر درس را با متن و تمرین تکمیل کن.'},{t:'DW — Langsam gesprochene Nachrichten',n:'برای B1/B2؛ بدون متن، با متن، و سپس shadowing.'},{t:'Easy German',n:'گفت‌وگوی واقعی با زیرنویس؛ پل مناسب از B1 به زبان طبیعی.'},{t:'Deutschlandfunk / Tagesschau',n:'از B2 به بالا؛ خلاصه شفاهی و پنج واژه کاربردی استخراج کن.'}]
};
