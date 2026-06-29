json.data @listings, partial: 'api/v1/transfer_listings/listing', as: :listing
json.meta do
  json.total_count  @meta[:total_count]
  json.current_page @meta[:current_page]
  json.total_pages  @meta[:total_pages]
end
