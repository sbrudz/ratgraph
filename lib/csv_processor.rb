require 'csv'

CSV.open('../source/data/nyc_rodent_complaints.csv', headers:true) do |complaint|

	complaints = complaint.each
	complaints.next

	CSV.open('../source/data/nyc_rodent_complaints_cleaned.csv', 'w') do |cleaned|
		cleaned << complaint.headers()
		complaints.each do |row|
			created = DateTime.strptime(row['Created Date'], '%m/%d/%Y %I:%M:%S %p')
			row['Created Date'] = created.to_time.to_i * 1000
			row['Borough'] = row['Borough'].capitalize
			cleaned << row
		end
	end
end
