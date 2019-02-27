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


function paragraph (p) {
  let c = p.getAttribute('class')||'null'
  switch (c.split(' ')[0]) {
    case 'Titles_Section-title':
      console.log('section',n++, p.innerText)
      r[p.innerText] = s = {type:'section'}
      break
    case 'Titles_Chapter-title':
      console.log('chapter',n++, p.innerText)
      r[p.innerText] = s = {type:'chapter', prob:[], soln:[], disc:[], when:[], then:[]}
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
    console.log([s.type, k, e.join(' ')].join(','))
  }
}