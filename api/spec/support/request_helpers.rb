module RequestHelpers
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{user.generate_jwt}" }
  end
end
