require 'csv'
require 'set'

demographics = CSV.read('../source/data/nyc_zip_demographics.csv', headers:true)
index = Hash.new
demographics.each do |row|
	index[row['zip_code']] = row
end

errors = CSV.open('../source/data/error_log.csv', 'w')

CSV.open('../source/data/nyc_rodent_complaints.csv', headers:true) do |complaint|

	complaints = complaint.each
	complaints.next
	errors << complaint.headers

	missing_zips = Hash.new(0)

	CSV.open('../source/data/nyc_rodent_complaints_cleaned.csv', 'w') do |cleaned|
		cleaned << ['Created Date','Descriptor','Incident Zip','Borough','Latitude','Longitude']
		complaints.each do |row|
			created = DateTime.strptime(row['Created Date'], '%m/%d/%Y %I:%M:%S %p')
			utc_created = created.to_time.to_i * 1000

			# Fix for central park miscategorization
			if row['Unique Key'] == '28778395'
				row['Incident Zip'] = '00083'
			end

			lookup = index[row['Incident Zip']]

			if row['Descriptor'] == 'Rodent Bite - PCS Only'
				next
			end

			if lookup
				cleaned << [utc_created, row['Descriptor'], row['Incident Zip'], 
					lookup['borough'], row['Latitude'], row['Longitude']]
			elsif row['Incident Zip']
				count = missing_zips[row['Incident Zip']]
				missing_zips[row['Incident Zip']] = count+1
				errors << row
			else
				count = missing_zips['none']
				missing_zips['none'] = count+1
				errors << row
			end
		end
	end

	missing_zips.each do |key, value|
		puts key.to_s + "\t" + value.to_s
	end

end
