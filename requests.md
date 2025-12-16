curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -H 'Authorization: Bearer honoiscool' \
  -d '{"username":"admin","password":"secret"}'

# If 'honoiscool' is supposed to be the token:
http POST :5000/auth/signup \
  username = yums \
  phone_number=0234512345 \
  fullname='Elias Walton' \
  lastname=Derby \
  email=elias90@gmail.com \
  password='erefss' \
  Authorization:"Bearer honoiscool"

http POST :5000/auth/signup \
  username='Test User Name' \
  phone_number=0234512345 \
  fullname='Elias Walton' \
  lastname=Derby \
  email=elias90@gmail.com \
  password='erefss' \
  Authorization:"Bearer honoiscool"

http POST :5000/login \
  username='Test User Name' \
  password='erefss' 