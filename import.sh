# import an export.json to add/replace wiki pages
# usage sh import.sh ~/Downloads/export.json ~/.wiki/roots.cg.home.c2.com

(
  cd $2/pages
  ls | grep -v welcome-visitors | grep -v table-of-contents | while read i; do rm $i; done
)
cat $1 |
jq -c -r 'keys[] as $slug|"\($slug)\n\(.[$slug])"' |
  while read -r slug ; do
    read -r item
    printf "%s" "$item" | jq . > "$2/pages/$slug"
  done
rm -f $2/status/sitemap*

# see http://admin.asia.wiki.org/reloading-from-backup.html
