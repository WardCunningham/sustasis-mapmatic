// build wiki site from html of ebook
// usage: <script src="growing.js"></script>

(function () {

  let embeddedimages = []
  let cites = {} // title => index
  let urls = {} // title => likely url

  console.log('starting')
  build()

function build () {
  // debugger
  let r = parse()
  console.log('parse',r)

  let d = dump(r)
  console.log('dump', d)

  let e = generate(r)
  console.log('site',e)

  let bundle = {dump: d, site: e}
  download(JSON.stringify(bundle, null, '  '), 'bundle.json', 'text/plain')
}

function parse () {
  // [
  //   {meta, body: [
  //     {section, body: [
  //       {pattern, problem, solution}

  let r = []
  let meta, section, pattern

  fix = {
     // from Walkable Multi-Mobility, Hospital
    "Sanctuary": "Pedestrian Sanctuary",
     // from Smart Av System
    "Responsive Transportation Network Companies": "Responsive Transportation Network Company",
    "Place And Differentiation": "Economies Of Place And Differentiation",
    "Local Transport Area": "Local Transport Areas"
  }

  apl = [
    // without citation
    'FOUR-STORY LIMIT',
    'LOCAL TRANSPORT AREAS',
    'SIX-FOOT BALCONY',
    'PEDESTRIAN STREET',

    // with citation
    'BUS STOP',
    'ARCADES',
    'ROW HOUSES',
    'ORNAMENT',

    'ACTIVITY POCKET',
    'CIRCULATION REALMS',
    'CONNECTED BUILDINGS',
    'DEEP REVEALS',
    'DENSITY RING',
    'FAMILY OF ENTRANCES',
    'FRAMES AS THICKENED EDGES',
    'GALLERY SURROUND',
    'HIERARCHY OF OPEN SPACE',
    'INTERIOR WINDOWS',
    'MAIN GATEWAYS',
    'OUTDOOR ROOM',
    'PATHS AND GOALS',
    'POOLS OF LIGHT',
    'POSITIVE OUTDOOR SPACE',
    'QUIET BACKS',
    'SMALL PANES',
    'SOFT TILE AND BRICK',
    'SOLID DOORS WITH GLASS',
    'WARM COLORS']
    .reduce((a,b)=> (a[titlecase(b)]=true,a),{})

  let p_classes = {}
  let titles = {}
  each(document, 'p', (p) => {
    let c = (p.getAttribute('class')||'null').split(' ')[0]
    p_classes[c] = (p_classes[c] || 0) + 1
    if (c == 'Pattern-styles_PATTERN-TITLE') {
      let t = titlecase(p.innerText.split(/\. /)[1])
      titles[t] = t
    }
  })
  console.log('classes', p_classes)
  // console.log('titles',Object.keys(titles).sort())

  each(document, 'p', paragraph)
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
        meta.body.push(section = {section:titlecase(m[1]),index:m[0],parent:meta,list:[],body:[]})
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
        section.body.push(pattern = {pattern:titlecase(m[1]),index:m[0],parent:section,discuss:[],notes:[],links:[]})
        pattern.image = p.nextElementSibling.querySelector('img').src.split('/').slice(-1)[0]
        break
      case 'Pattern-styles_Upward-text':
        pattern.upward = resolve(p)
        break
      case 'Pattern-styles_Problem-statement':
        pattern.problem = resolve(p)
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
        pattern.notes.push(resolve(p))
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

// cat site/pages/* | jq -r '.story[]|select(.type=="paragraph")|.text' | egrep '[A-Z]{5,}' | perl -pe 'print "\n"'
  function resolve (p) {
    function convert(title, index) {
      let link = titlecase(title)
      link = fix[link]||link
      link = titles[link]||titles[link.replace(/s$/,'')]||link
      if (!(titles[link] || apl[link])) console.log('resolve', `<${title}>`, index)
      if (!(titles[link])) cites[title] = index||'omitted'
      return `[[${link}]]`
    }

    result = p.innerText.replace(/^\. \. \./,'…').replace(/\. \. \.$/,'…')
    // each(p,'span',(f)=>{if((f.getAttribute('class')||'').match(/Footnote/))console.log('footnote', f)})
    result = result.replace(
      /([A-Z0-9-]{3,}( [A-Z-]{2,})+)( +\(.+?\))?/g,
      (p0, p1, p2, p3) => convert(p1,p3))
    result = result.replace(
      /([A-Z-]{4,})( ?\(.+?\))/g,
      (p0, p1, p2) => convert(p1,p2))
    result = result.replace(/([^\d]\.|complexity)(\d)( |$)/g,(p0,p1,p2,p3)=> p1+"⁰¹²³⁴⁵⁶⁷⁸⁹".substring(p2,1*p2+1)+p3)
    result = result.replace(/^(\d)( )/g,(p0,p1,p2)=> "⁰¹²³⁴⁵⁶⁷⁸⁹".substring(p1,1*p1+1)+p2)
    if (m = result.match(/([^ ]+)\.(com|org|gov|edu|net|eu|uk|cz|de)\b/)) urls[pattern.pattern]=m[0] // console.log('url', pattern.pattern, result)
    if (m = result.match(/\bhttps?:\/\/[^ ]+/)) urls[pattern.pattern]=m[0]

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
  let nav = {
    "Growing Regions":"Places, networks and processes…",
    "Patterns Of Scale":"Focusing on a single urban scale…",
    "Patterns Of Multiple Scale":"Spanning a range of urban scales…",
    "Patterns Of Process":"Generative tools and strategies…"
  }


  // Growing Regions
  let story = r.map(x => {
    let count = x.body.reduce((s,e) => s + e.list.length, 0)
    return {type:'markdown',text:`[[${x.meta}]]\n${count} patterns…`}})
  story.unshift({type:'paragraph', text:nav['Growing Regions']})
  story.push({type:'graphviz', text:'DOT FROM two-level-diagram'})
  e.push({title: 'Growing Regions', story})

  // Patterns of xyz
  for (let meta of r) {
    let story = meta.body.map(s =>
      ({type:'markdown',text:`[[${s.section}]]\n${s.description}`}))
    story.push({type:'graphviz', text:'DOT FROM two-level-diagram'})
    story.unshift({type:'paragraph', text:nav[meta.meta]})
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
      story.push({type:'paragraph', text:`See more [[${section.parent.meta}]]`})
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
        story.push({type:'paragraph', text:`See more [[${pattern.parent.section}]]`})
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

  e.push({
    title:'Patterns Cited',
    story: Object.keys(cites)
      .map(k=>({
        type:'paragraph',
        text:`[[${k}]] ${cites[k]}`
      }))
    })

  e.push({
    title:'Bare URLs',
    story: Object.keys(urls)
      .map(k=>({
        type:'paragraph',
        text:`[[${k}]] ${urls[k]}`
      }))
    })
  e.slice(-1)[0].story.unshift({type:'paragraph',text:`${Object.keys(urls).length} pages with urls.`})

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

})()