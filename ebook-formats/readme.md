
Request version in ebook/html format with only patterns present.

Download from dropbox into new subdiretory.

  `14.01.2020`

Clone extractor growing.js and add script tag at end of html.

  `<script src="growing.js"></script>`

Confirm paragraph types are as expected.
```
  Section-styles_META-SECTION: 3
  Section-styles_SECTION: 20
  Section-styles_Section-description: 20
  Section-styles_Section-list: 80
  Pattern-styles_PATTERN-TITLE: 80
  Pattern-styles_Upward-text: 80
  Pattern-styles_-----: 160
  Pattern-styles_Problem-statement: 80
  Pattern-styles_Normal: 324
  Pattern-styles_Therefore: 80
  Pattern-styles_Solution: 80
  Pattern-styles_Downward-text: 79
  Pattern-styles_footnote-line: 76
  Pattern-styles_footnote: 136
  Images_Image-captions: 56
  Pattern-styles_Normal-Italic--quote-: 2
```
Expected use of each style.

```
  SECTION STYLES:

  Metasection – begins on new page, in capital letters
  Section – begins on new page, covers 4 patterns every time
  Section description – in Italic
  Section list – bulleted list of the 4 patterns

  PATTERN STYLES:

  Pattern title – regular, capital letters
  Upward text – regular, based on Normal text
  * * * – separation element
  Problem statement – bold version of the Normal text
  Normal – regular body text of the Discussion section
  Normal Italic (quote) – italic, text of the discussion
  Therefore – regular, indent 4 mm
  Solution – bold (same as problem statement)
  Downward text – regular, the same as upward text
  Footnote – regular, smaller size text at the end of the paragraph
  (NB: there is also one Character style, called Footnote number that marks the footnote number in the Discussion)
  Footnote line – line above footnotes at the end of the paragraph

  IMAGES:

  Image captions – in italic, under images in Discussion section
  Big photo – at the beginning of each pattern, centers the image and adds space between the pattern title.
```
Parse p elements dispatching on class. Debug one switch at a time. Build a heirarcy of nested elements.
```
  [
    {meta, body: [
      {section, body: [
        {pattern, problem, solution} ...
```
Generate a list of mostly complete pages. Use many passes, going deeper each pass. Export this as export.json.
```
  [
    {title, story}
    {title, story} ...
```
Capture the export.json, expand it into complete pages adding slug of title, random ids on story items, and a journal with one create action.
