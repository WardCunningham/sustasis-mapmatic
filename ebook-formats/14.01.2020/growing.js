// build wiki site from html of ebook
// usage: <script src="growing.js"></script>

console.log('starting')
build()

function build () {
  // debugger
  let r = parse()
  console.log('parse',r)
  // let j = typecheck(r)
  // console.log('typecheck',j)
  let e = generate(r)
  console.log('export',e)
  download(JSON.stringify(e, null, '  '), 'export.json', 'text/plain')
}

function parse () {
  // [
  //   {meta, body: [
  //     {section, body: [
  //       {pattern, problem, solution}

  let r = []
  let meta, section, pattern

  let p_classes = {}
  each(document, 'p', (p) => {
    let c = (p.getAttribute('class')||'null').split(' ')[0]
    p_classes[c] = (p_classes[c] || 0) + 1
  })
  console.log('classes', p_classes)

  each(document, 'p', paragraph)
  return r

  function paragraph (p) {
    let c = p.getAttribute('class')||'null'
    const capfix = (cap) => allcaps(fix[titlecase(cap)]||cap)

    var m

    switch (c.split(' ')[0]) {
      case 'Section-styles_META-SECTION':
        // console.log(c, p.innerText)
        m = p.innerText.split(/\n/)
        r.push(meta = {meta:titlecase(m[1]),index:m[0],body:[]})
        break
      case 'Section-styles_SECTION':
        // console.log(c, p.innerText)
        m = p.innerText.split(/\. /)
        meta.body.push(section = {section:titlecase(m[1]),index:m[0],list:[],body:[]})
        break
      case 'Section-styles_Section-description':
        // console.log(c, p.innerText)
        section.description = p.innerText
        break
      case 'Section-styles_Section-list':
        // console.log(c, p.innerText)
        m = p.innerText.split(/\. /)
        section.list.push({pattern:m[1],index:m[0]})
        break
      case 'Pattern-styles_PATTERN-TITLE':
        // console.log(c, p.innerText)
        m = p.innerText.split(/\. /)
        section.body.push(pattern = {pattern:titlecase(m[1]),index:m[0]})
        pattern.image = p.nextElementSibling.querySelector('img').src.split('/').slice(-1)[0]
        break
      case 'Pattern-styles_-----':
        break
      default:
        // console.log('   ', c)
    }
    // console.log('      ', c,p.innerText.substring(0,30))
  }

  function resolve (p) {
    result = p.innerText
    each(p,'span',(x) => {
      m = x.innerText.match(/[A-Z0-9\.-]+( [A-Za-z0-9\.-]+)*/)
      if (m && m[0].length>5) {
        let link = titlecase(m[0])
        link = fix[link]||link
        let plink = `[[${link}]]`
        result = result.replace(m[0],plink)
        s.links.push(slug(link))
      }
    })
    return result
  }
}

function each (element, tag, fun) {
  let elements = element.getElementsByTagName(tag)
  for (var i = 0; i<elements.length; i++) {
    fun(elements[i])
  }
}

function typecheck(r) {
  let csv = ['type,chapter,slug,checks']
  let j = []
  let valid = Object.keys(r).map(k=>slug(k))
  for (k in r) {
    if (k == 'CASE STUDIES') break
    let s = r[k]
    let e = []
    if(s.type=='chapter') {
      if (s.prob.length != 1) e.push('prob-len-'+s.prob.length);
      if (s.soln.length != 1) e.push('soln-len-'+s.soln.length);
      if (s.when.length != 1) e.push('when-len-'+s.when.length);
      if (s.then.length != 1) e.push('then-len-'+s.then.length);
      if (s.disc.length == 0) e.push('disc-len-'+s.disc.length);
      s.links.map(l=>{if (!(valid.includes(l)||valid.includes(l.replace(/s$/,'')))) {e.push('link-'+l)}})
    }
    csv.push([s.type, k.replace(/,/,' '), slug(k), e.join(' ')].join(','))
    j.push([slug(k),...e])
  }
  return j
  // download(csv.join("\n"), 'checks.csv', 'text/plain')
}

function table(pats) {
  let tab = ['<table cellpadding=6>']
  for (let i = 0; i<pats.length; i++) {
    let pat = pats[i]
    if (i%2 == 0) {
      tab.push('<tr>')
    }
    tab.push(`<td><center><img width="200px" height="255px" src="http:/assets/image/${pat.image}"><br>`)
    tab.push(`[[${pat.pattern}]]</center>`)
  }
  return tab.join("\n")
}

function generate(r) {
  let e = []

  e.push({
    title: 'The Whole Story',
    story: r.map(x => {
      let count = x.body.reduce((s,e) => s + e.list.length, 0)
      return {type:'markdown',text:`[[${x.meta}]]\n${count} patterns…`}
    })
  })

  // Patterns of xyz
  for (let meta of r) {
    let story = meta.body.map(s =>
      ({type:'markdown',text:`[[${s.section}]]\n${s.description}`}))
    let p = {title: meta.meta, story, assets: []}
    e.push(p)
  }

  // xyz Patterns
  for (let meta of r) {
    for (let section of meta.body) {
      let story = []
      // section.body.map(p =>
      //   ({type:'html',text:`<img width="40%" src="http:/assets/image/${p.image}"><br>[[${p.pattern}]]`}))
      story.push({type:'paragraph',text:section.description})
      story.push({type:'html',text:table(section.body)})
      // story.push({type:'code', text:JSON.stringify(section,null,2)})
      e.push({title:section.section, story, assets:[]})
    }
  }

  // xyz Pattern
  for (let meta of r) {
    for (let section of meta.body) {
      for (let pattern of section.body) {
        let story = [{type:'code', text:JSON.stringify(pattern,null,2)}]
        e.push({title:pattern.pattern, story, assets:[]})
      }
    }
  }
  // let section = null
  // for (k in r) {
  //   if (k == 'CASE STUDIES') break
  //   let s = r[k]
  //   console.log(s.type,k)
  //   switch (s.type) {
  //     case 'chapter':
  //       var p = {title: titlecase(k), story:[]}
  //       e[slug(k)] = p
  //       p.story.push({type:'paragraph', text:(s.disc[0]||'Mumble.').replace(/Discussion: /,'').substring(0,100), id:id()})
  //       p.story.push(image(titlecase(k)))
  //       p.story.push({type:'paragraph', text:s.prob[0], id:id()})
  //       p.story.push({type:'paragraph', text:'Therefore:', id:id()})
  //       p.story.push({type:'paragraph', text:s.soln[0], id:id()})
  //       p.story.push({type:'paragraph', text:'When '+titlecase(s.when[0]||''), id:id()})
  //       p.story.push({type:'paragraph', text:'Then '+titlecase(s.then[0]||''), id:id()})
  //       p.story.push({type:'paragraph', text:`See more [[${section}]]`, id:id()})
  //       p['journal']=[{type: 'create', item:deepCopy(p), date:Date.now()}]
  //       break
  //     case 'section':
  //       section = titlecase(k)
  //       var p = {title: titlecase(k), story:[]}
  //       e[slug(k)] = p
  //       p.story.push({type:'paragraph', text:'What force unites these patterns?', id:id()})
  //       p.story.push(image(titlecase(s.patn[1])))
  //       p.story.push(image(titlecase(s.patn[0])))
  //       p.story.push(image(titlecase(s.patn[3])))
  //       p.story.push(image(titlecase(s.patn[2])))
  //       p.story.push({type:'paragraph', text:' ', id:id()})
  //       p.story.push({type:'graphviz', text:section_graph, id:id()})
  //       p.story.push({type:'markdown', text:(s.patn.map(x=>`- [[${x}]]`).join("\n")), id:id()})
  //       p['journal']=[{type: 'create', item:deepCopy(p), date:Date.now()}]
  //       break
  //     default:
  //       console.log('skip',k)
  //   }
  // }
  return e

  function image(title) {
    let src = caps[title] ? r[caps[title]].img[0] : 'missing.jpg'
    return {type:'image', text:`[[${title}]]`, url:`http:/assets/patterns/${src}`, id:id()}
  }

  function gallery(title) {
    let image = caps[title] ? r[caps[title]].img[0] : 'missing.jpg'
    return `<img width=49% src=http:/assets/patterns/${image}>`
  }

  function diagram (slg) {
    const quote = (string) => `"${string.replace(/ +/g,'\n')}"`
    const node = (title,color) => `${quote(title)} [fillcolor=${e[slug(title)]?color:'lightgray'}]`
    var dot = ['node [shape=box style=filled fillcolor=lightgray]','rankdir=LR']
    var dotmore = []
    var page = e[slg]
    const links = /\[\[(.+?)\]\]/g
    while(more = links.exec(page.story[1].text)) {
      let title = more[1]
      // console.log('title',title)
      dotmore.push(node(title,'bisque'))
      if(e[slug(title)]) {
        let page2 = e[slug(title)]
        for (var i = 0; i<page2.story.length; i++) {
          let text2 = page2.story[i].text
          const links2 = /\[\[(.+?)\]\]/g
          if (text2.match(/^When /)) {
            while(more2 = links2.exec(text2)) {
              // console.log('when',more2[1])
              dot.push(node(more2[1],'lightblue'))
              dot.push(`${quote(more2[1])} -> ${quote(title)}`)
            }
          }
          if (text2.match(/^Then /)) {
            while(more2 = links2.exec(text2)) {
              // console.log('then',more2[1])
              dot.push(node(more2[1],'lightblue'))
              dot.push(`${quote(title)} -> ${quote(more2[1])}`)
            }
          }
        }
      } else {
        dot.push(`${quote('pre-'+title+'-one')} -> ${quote(title)}`)
        dot.push(`${quote(title)} -> ${quote('post-'+title+'-one')}`)
        dot.push(`${quote('pre-'+title+'-two')} -> ${quote(title)}`)
        dot.push(`${quote(title)} -> ${quote('post-'+title+'-two')}`)
      }
    }

    return `strict digraph {\n${dot.concat(dotmore).join("\n")}\n}`
  }


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

function allcaps(string) {
  return string
    .replace(/(a-z)/g, (_, m1) => m1.toUpperCase())
}

function download(text, name, type) {
  let a = document.createElement("a");
  let file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
}