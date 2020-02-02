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

def expand site, dir
    items = 0
    site.each do |page|
      title = page['title']
      page['story'].each do |item|
        item['id'] = (rand*100000000000000).to_i.to_s
        items += 1
      end
      page['journal'] = [{type:'create',item:deepcopy(page),date:@now}]
      File.open("#{dir}/pages/#{asSlug(title)}","w") do |file|
        file.puts JSON.pretty_generate page
      end
    end
    flush("#{dir}/status/sitemap.json")
    flush("#{dir}/status/sitemap.xml")
    puts "#{items} to #{dir} at #{Time.now()}"
end

def bundle
  download = "/Users/ward/Downloads/bundle.json"
  if File.exist? download
    bundle = JSON.parse File.read(download)
    bundle.each do | dir, site |
      expand site, dir
    end
    File.delete download
  end
end

while true
  bundle
  sleep 1
end
