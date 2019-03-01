# update limited distribution site
# usage: sh sync.sh

rsync -avz ~/.wiki/growing.localhost/pages/ root@bay.wiki.org:.wiki/growing.bay.wiki.org/pages/
rsync -avz ~/.wiki/growing.localhost/assets/ root@bay.wiki.org:.wiki/growing.bay.wiki.org/assets/
ssh root@bay.wiki.org 'cd .wiki/growing.bay.wiki.org/status; rm -f sitemap.*'