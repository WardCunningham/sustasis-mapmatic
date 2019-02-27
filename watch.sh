# import generated pages each time an export.json file appears
# usage: sh watch.sh ~/Downloads/export.json ~/.wiki/growing.localhost

while sleep 1; do
  if [ -f $1 ]; then
    echo doing
    sh import.sh $1 $2
    rm $1
    echo waiting
  fi
done
