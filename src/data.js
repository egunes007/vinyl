// Tamamı örnek içeriktir. Kapaklar özgün grafik yer tutuculardır.
export const albums = [
 {id:1,artist:'Pink Floyd',album:'The Dark Side of the Moon',year:1973,genre:'Rock',style:'Progressive Rock',country:'Birleşik Krallık',label:'Harvest',cover:'prism',mark:'△',color:'#172b3a'},
 {id:2,artist:'Daft Punk',album:'Random Access Memories',year:2013,genre:'Electronic',style:'Disco / Electronic',country:'Fransa',label:'Columbia',cover:'chrome',mark:'◒',color:'#454a50'},
 {id:3,artist:'Barış Manço',album:'2023',year:1975,genre:'Anadolu Rock',style:'Psychedelic Rock',country:'Türkiye',label:'Yavuz',cover:'sun',mark:'2023',color:'#a64720'},
 {id:4,artist:'Metallica',album:'Master of Puppets',year:1986,genre:'Metal',style:'Thrash Metal',country:'ABD',label:'Elektra',cover:'cross',mark:'✝',color:'#704331'},
 {id:5,artist:'Radiohead',album:'In Rainbows',year:2007,genre:'Alternative',style:'Art Rock',country:'Birleşik Krallık',label:'XL Recordings',cover:'rainbow',mark:'IN / RAINBOWS',color:'#b34b28'},
 {id:6,artist:'David Bowie',album:'Heroes',year:1977,genre:'Rock',style:'Art Rock',country:'Almanya',label:'RCA',cover:'mono',mark:'HEROES',color:'#525252'},
 {id:7,artist:'Nina Simone',album:'Pastel Blues',year:1965,genre:'Jazz',style:'Soul / Blues',country:'ABD',label:'Philips',cover:'blue',mark:'NINA',color:'#164a6b'},
 {id:8,artist:'Büyük Ev Ablukada',album:'Fırtınayt',year:2017,genre:'Alternative',style:'Indie / Electronic',country:'Türkiye',label:'Olmadı Kaçarız',cover:'wave',mark:'FIRTINAYT',color:'#395e4c'}
];
export function filterAlbums(query = '', genre = '') {
 const term = query.trim().toLocaleLowerCase('tr-TR');
 return albums.filter(a => (!genre || a.genre === genre) && `${a.artist} ${a.album}`.toLocaleLowerCase('tr-TR').includes(term));
}
