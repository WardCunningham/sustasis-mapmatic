# update limited distribution site
# usage: sh sync.sh

rsync -avz site/pages/ root@bay.wiki.org:.wiki/npl.wiki/pages/
rsync -avz site/assets/ root@bay.wiki.org:.wiki/npl.wiki/assets/
ssh root@bay.wiki.org 'cd .wiki/npl.wiki/status; rm -f sitemap.*'