require 'json'

@now = Time.now.to_i * 1000

def asSlug title
  title.gsub(/\s/, '-').gsub(/[^A-Za-z0-9-]/, '').downcase
end

def flush sitemap
  File.delete(sitemap) if File.exist?(sitemap)
end

def deepcopy obj
  JSON.parse JSON.generate obj
end

def expand export, dir
  if File.exist? export
    site = JSON.parse File.read(export)
    site.each do |page|
      puts title = page['title']
      page['story'].each do |item|
        item['id'] = (rand*100000000000000).to_i.to_s
      end
      page['journal'] = [{type:'create',item:deepcopy(page),date:@now}]
      File.open("#{dir}/pages/#{asSlug(title)}","w") do |file|
        file.puts JSON.pretty_generate page
      end
    end
    File.delete export
    flush("#{dir}/status/sitemap.json")
    flush("#{dir}/status/sitemap.xml")
    puts
  end
end

while true
  expand "/Users/ward/Downloads/export.json", "site"
  expand "/Users/ward/Downloads/dump.json", "dump"
  sleep 1
end
