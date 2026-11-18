// Bundled CC BY 4.0 recordings; never replace a user's local uploads.
const CITY_MUSIC = {
  "san-francisco": {
    "city": "san-francisco",
    "title": "Easy Lemon",
    "isrc": "USUAN1200076",
    "mood": "轻快吉他 · 海湾散步",
    "artist": "Kevin MacLeod",
    "url": "assets/music/san-francisco.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200076",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "los-angeles": {
    "city": "los-angeles",
    "title": "Beachfront Celebration",
    "isrc": "USUAN1200022",
    "mood": "海滨节奏 · 阳光海岸",
    "artist": "Kevin MacLeod",
    "url": "assets/music/los-angeles.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200022",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "seattle": {
    "city": "seattle",
    "title": "Dream Culture",
    "isrc": "USUAN1300046",
    "mood": "梦幻钢琴 · 雨城漫步",
    "artist": "Kevin MacLeod",
    "url": "assets/music/seattle.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "washington": {
    "city": "washington",
    "title": "Americana",
    "isrc": "USUAN1200092",
    "mood": "管弦乐 · 城市纪念",
    "artist": "Kevin MacLeod",
    "url": "assets/music/washington.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200092",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "philadelphia": {
    "city": "philadelphia",
    "title": "Funkorama",
    "isrc": "USUAN1100474",
    "mood": "放克律动 · 街头漫游",
    "artist": "Kevin MacLeod",
    "url": "assets/music/philadelphia.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100474",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "new-york": {
    "city": "new-york",
    "title": "George Street Shuffle",
    "isrc": "USUAN1300035",
    "mood": "轻爵士 · 纽约街景",
    "artist": "Kevin MacLeod",
    "url": "assets/music/new-york.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300035",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  },
  "boston": {
    "city": "boston",
    "title": "Backbay Lounge",
    "isrc": "USUAN1700068",
    "mood": "休闲爵士 · 学院街区",
    "artist": "Kevin MacLeod",
    "url": "assets/music/boston.mp3?v=loudness1",
    "source": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700068",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }
};
function locationMusic(t){
 const m=t?.music||{};
 if(m.audioId)return {...m,url:null,builtinKey:null};
 const track=CITY_MUSIC[t?.cityKey];
 if(!track)return m;
 return {...track,builtinKey:t.cityKey,confirmed:true,start:0,...(m.builtinKey===t.cityKey?{title:m.title||track.title,start:m.start||0,confirmed:m.confirmed!==false}:{}),audioId:null};
}
async function locationMusicURL(t){const m=locationMusic(t);return m.audioId?await fileURL(m.audioId):m.url||null;}
const musicBackupValidator=validateState;
validateState=function(raw){const result=musicBackupValidator(raw);for(const t of result.trips){const m=raw.trips.find(x=>x.id===t.id)?.music;if(m?.builtinKey&&CITY_MUSIC[m.builtinKey]&&m.builtinKey===t.cityKey)t.music.builtinKey=m.builtinKey;}return result;};

