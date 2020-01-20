// build wiki site from html of ebook
// usage: <script src="growing.js"></script>

console.log('starting')
build()

function build () {
  // debugger
  let r = parse()
  console.log('parse',r)

  let d = dump(r)
  console.log('dump', d)
  download(JSON.stringify(d, null, '  '), 'dump.json', 'text/plain')

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
  let spanchecks = []
  let embeddedimages = []

  fix = {
    "Form-Based Codes": "Form-Based Code",
     // from Walkable Multi-Mobility, Hospital
    "Sanctuary": "Pedestrian Sanctuary",
     // from Smart Av System
    "Responsive Transportation Network Companies": "Responsive Transportation Network Company"
  }

  // elipsis: . . . ⇒ …  (x45)

  let p_classes = {}
  let titles = {}
  each(document, 'p', (p) => {
    let c = (p.getAttribute('class')||'null').split(' ')[0]
    p_classes[c] = (p_classes[c] || 0) + 1
    if (c == 'Pattern-styles_PATTERN-TITLE') {
      titles[titlecase(p.innerText.split(/\. /)[1])] = true
    }
  })
  console.log('classes', p_classes)
  // console.log('titles',Object.keys(titles))

  each(document, 'p', paragraph)
  // console.log('spanchecks',spanchecks)
  // console.log('markdown',Object.keys(spanchecks).map(k=>`[[${k}]]\n${spanchecks[k].join("\n")}`).join("\n\n"))
  // console.log('embeddedimages',embeddedimages.join("\n"))
  return r

  function paragraph (p) {
    let c = p.getAttribute('class')||'null'
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
        section.body.push(pattern = {pattern:titlecase(m[1]),index:m[0],discuss:[],notes:[],links:[]})
        pattern.image = p.nextElementSibling.querySelector('img').src.split('/').slice(-1)[0]
        break
      case 'Pattern-styles_Upward-text':
        pattern.upward = resolve(p)
        break
      case 'Pattern-styles_Problem-statement':
        pattern.problem = p.innerText
        break
      case 'Pattern-styles_Normal':
        pattern.discuss.push({type:'paragraph', text:resolve(p)})
        illustrate(p,url => pattern.discuss.push({type:'html', text:`<center><img width=60% src="${url}">`}))
        break
      case 'Pattern-styles_Solution':
        pattern.solution = resolve(p)
        illustrate(p,url => pattern.illustration = ({type:'html', text:`<center><img width=60% src="${url}">`}))
        break
      case 'Pattern-styles_Downward-text':
        pattern.downward = resolve(p)
        break
      case 'Pattern-styles_footnote':
        pattern.notes.push(p.innerText)
        break
      case 'Pattern-styles_-----':
        pattern.discuss.push({type:'html', text:'<center>❖ ❖ ❖</center>'})
        break
      case 'Images_Image-captions':
        let i = p.previousElementSibling.querySelector('img')
        if (i) {
          embeddedimages.push(`[[${pattern.pattern}]] ${pattern.discuss.length} ${section.section}`)
          let url = `http:/assets/image/${i.src.split('/').splice(-1)[0]}`
          // insert image before the paragraph that preceeds to improve run-around
          pattern.discuss.splice(-1,0,{type:'image', text:resolve(p), url})
        }
        break
      case 'Pattern-styles_Normal-Italic--quote-':
        console.log('blockquote',section.section, pattern.pattern)
        pattern.discuss.push({type:'html', text:`<blockquote>${resolve(p)}</blockquote>`})
        break
      case 'Pattern-styles_Therefore':
      case 'Pattern-styles_footnote-line':
        break
      default:
        console.log('   ', c)
    }
    // console.log('      ', c,p.innerText.substring(0,30))
  }

  function resolve (p) {
    result = p.innerText
    each(p,'span',(x) => {
      // m = x.innerText.match(/[A-Z0-9\.-]+( [A-Za-z0-9\.-]+)*/)
      m = x.innerText.match(/[A-Z0-9\. -]+/)
      if (m && m[0].length>5) {
        let link = titlecase(m[0])
        link = fix[link]||link
        if (!titles[link]) {
          console.log('bad link', link, p)
        }
        let plink = `[[${link}]]`
        result = result.replace(m[0],plink)
        // pattern.links.push(slug(link))
      }
    })
    spancheck(result)
    return result
  }

  function illustrate (p,yes) {
    // an illustration follows a normal paragraph and does not have a caption
    let ii = p.nextElementSibling.querySelector('img')
    let cc = p.nextElementSibling.nextElementSibling.getAttribute('class')
    if (ii && cc && cc.split(' ')[0] != 'Images_Image-captions') {
      yes(`http:/assets/image/${ii.src.split('/').splice(-1)[0]}`)
    }
  }

  function spancheck (text) {
    const link = /[A-Z]{3,}[A-Z -]{5,}[A-Z]( *\(.*?\))?/
    if (m = text.match(link)) {
      let p = pattern.pattern
      spanchecks[p] = spanchecks[p] || []
      spanchecks[p].push(m[0])
    }
  }

}

function each (element, tag, fun) {
  let elements = element.getElementsByTagName(tag)
  for (var i = 0; i<elements.length; i++) {
    fun(elements[i])
  }
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

  // Growing Regions
  let story = r.map(x => {
    let count = x.body.reduce((s,e) => s + e.list.length, 0)
    return {type:'markdown',text:`[[${x.meta}]]\n${count} patterns…`}})
  story.push({type:'graphviz', text:'DOT FROM two-level-diagram'})
  e.push({title: 'Growing Regions', story})

  // Patterns of xyz
  for (let meta of r) {
    let story = meta.body.map(s =>
      ({type:'markdown',text:`[[${s.section}]]\n${s.description}`}))
    story.push({type:'graphviz', text:'DOT FROM two-level-diagram'})
    let p = {title: meta.meta, story}
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
      story.push({type:'graphviz', text:'DOT FROM pattern-cluster-diagram'})
      // story.push({type:'code', text:JSON.stringify(section,null,2)}
      e.push({title:section.section, story})
    }
  }

  // xyz Pattern
  for (let meta of r) {
    for (let section of meta.body) {
      for (let pattern of section.body) {
        let story = []
        story.push({type:'paragraph', text:pattern.upward})
        story.push({type:'html', text:`<center><img width=80% src="http:/assets/image/${pattern.image}">`})
        story.push({type:'markdown', text:`__${pattern.problem}__`})
        for (discussion of pattern.discuss) {
          story.push(discussion)
        }
        story.push({type:'markdown', text:`__Therefore: ${pattern.solution}__`})
        if (pattern.illustration) {
          story.push(pattern.illustration)
        }
        // story.push({type:'code', text:JSON.stringify(pattern,null,2)})
        story.push({type:'paragraph', text:pattern.downward})
        story.push({type:'pagefold',text:'notes'})
        for (footnote of pattern.notes) {
          story.push({type: 'paragraph', text:footnote})
        }
        e.push({title:pattern.pattern, story, assets:[]})
      }
    }
  }
  return e
}

function dump(r) {
  let e = []

  function line(obj) {
    return Array.isArray(obj) ? JSON.stringify(obj,null,2) : obj
  }

  function page(title, obj, look) {
    let text = Object.keys(obj)
      .filter(k => k != 'body')
      .map(k => `${k}: ${line(obj[k])}`)
      .join("\n\n")
    e.push({title, story:[
      {type:'code', text},
      {type:'markdown', text:(obj.body||[])
        .map(look)
        .map(t=>`- [[${t}]]`)
        .join("\n")
      }
    ]})
  }

  for (let meta of r) {
    page(meta.meta, meta, e=>e.section)
    for (let section of meta.body) {
      page(section.section, section, e=>e.pattern)
      for (let pattern of section.body) {
        page(pattern.pattern, pattern, e=>e)
      }
    }
  }
  return e
}


function titlecase(string) {
  return string
    .replace(/([A-Z])([A-Z]+)/g, (_, m1, m2) => m1+m2.toLowerCase())
    .replace(/\n/,' ')
    .replace(' Av ', ' AV ')
}


function download(text, name, type) {
  let a = document.createElement("a");
  let file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
}