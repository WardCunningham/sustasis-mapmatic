console.log('starting')

function each (tag, fun) {
  let elements = document.getElementsByTagName(tag)
  for (var i = 0; i<elements.length; i++) {
    fun(elements[i])
  }
}

let r = {}
let s = {type:'preface', body:[]}
let t = s.body
r['PREFACE']=s
let n = 0
each('p', paragraph)
console.log(r)
typecheck(r)
e = generate(r)
console.log('export',e)
var json = JSON.stringify(e, null, '  ')
download(json, 'export.json', 'text/plain')


function paragraph (p) {
  let c = p.getAttribute('class')||'null'
  switch (c.split(' ')[0]) {
    case 'Titles_Section-title':
      console.log('section',n++, p.innerText)
      r[p.innerText] = s = {type:'section'}
      break
    case 'Titles_Chapter-title':
      console.log('chapter',n++, p.innerText)
      r[p.innerText.replace(/\n/,' ')] = s = {type:'chapter', prob:[], soln:[], disc:[], when:[], then:[]}
      t = s.prob
      break
    case 'Body_upward-tekst':
      s.when.push(p.innerText)
      break
    case 'Body_Therefore':
      console.log(p.innerText)
      t = s.soln
      break
    case 'Body_-----':
      if (t===s.soln) {
        t = s.then
      }
      break
    case 'Body_Solution':
      t.push(p.innerText)
      if(t==s.prob){
        t=s.disc
      }
      break
    case 'Body_body-text':
      t.push(p.innerText)
      break
    default:
      // console.log('   ', c)
  }
  console.log('      ', c,p.innerText.substring(0,30))
}

function typecheck(r) {
  let csv = ['type,chapter,checks']
  for (k in r) {
    let s = r[k]
    let e = []
    if(s.type=='chapter') {
      if (s.prob.length != 1) e.push('prob-len-'+s.prob.length);
      if (s.soln.length != 1) e.push('soln-len-'+s.soln.length);
      if (s.when.length != 1) e.push('when-len-'+s.when.length);
      if (s.then.length != 1) e.push('then-len-'+s.then.length);
      if (s.disc.length == 0) e.push('disc-len-'+s.disc.length);
    }
    csv.push([s.type, k.replace(/,/,' '), e.join(' ')].join(','))
  }
  // download(csv.join("\n"), 'checks.csv', 'text/plain')
}

function generate(r) {
  e = {}
  for (k in r) {
    let s = r[k]
    if (k == 'CASE STUDIES') break
    console.log('generate',s.type,k)
    switch (s.type) {
      case 'chapter':
        let p = {title: titlecase(k), story:[]}
        e[slug(k)] = p
        p.story.push({type:'paragraph', text:'Summarize the pattern in a sentence.', id:id()})
        p.story.push({type:'paragraph', text:s.prob[0], id:id()})
        p.story.push({type:'paragraph', text:'Therefore:', id:id()})
        p.story.push({type:'paragraph', text:s.soln[0], id:id()})
        p.story.push({type:'paragraph', text:'When '+titlecase(s.when[0]||''), id:id()})
        p.story.push({type:'paragraph', text:'Then '+titlecase(s.then[0]||''), id:id()})
        p['journal']=[{type: 'create', item:deepCopy(p), date:Date.now()}]
      default:
        console.log('skip',k)
    }
  }
  return e
}

function slug (title) {
  return title
    .replace(/\s/g, '-')
    .replace(/[^A-Za-z0-9-]/g, '')
    .toLowerCase()
}

function id() {
  return `${Math.floor(Math.random()*100000000000)}`
}

function deepCopy (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function titlecase(string) {
  return string
    .replace(/([A-Z])([A-Z]+)/g, (_, m1, m2) => m1+m2.toLowerCase())
}

function download(text, name, type) {
  let a = document.createElement("a");
  let file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
}