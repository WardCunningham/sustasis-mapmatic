require 'json'

export = "/Users/ward/Downloads/export.json"

def asSlug title
  title.gsub(/\s/, '-').gsub(/[^A-Za-z0-9-]/, '').downcase
end

while true
  if File.exist? export
    site = JSON.parse File.read(export)
    site.each do |page|
      puts title = page['title']
      page['story'].each do |item|
        item['id'] = (rand*100000000000000).to_i.to_s
      end
      File.open("site/pages/#{asSlug(title)}","w") do |file|
        file.puts JSON.pretty_generate page
      end
    end
    File.delete export
    File.delete "site/status/sitemap.json"
    File.delete "site/status/sitemap.xml"
  end
  sleep 1
end
