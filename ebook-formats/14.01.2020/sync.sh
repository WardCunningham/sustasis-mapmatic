# update limited distribution site
# usage: sh sync.sh

rsync -avz site/pages/ root@bay.wiki.org:.wiki/anplfgr.bay.wiki.org/pages/
rsync -avz site/assets/ root@bay.wiki.org:.wiki/anplfgr.bay.wiki.org/assets/
ssh root@bay.wiki.org 'cd .wiki/anplfgr.bay.wiki.org/status; rm -f sitemap.*'