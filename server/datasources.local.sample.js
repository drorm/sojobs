module.exports = {
  'db': {
    'connector': 'postgresql',
    'host': 'localhost',
    'port': 5432,
    'database': 'jobs',
    'username': 'jobs',
    'password': 'xxxxxxxxxxxxxxxxx'
  },
  'mail': {
    'defaultForType': 'mail',
    'connector': 'mail',
    'transports': [ {
      'type': 'SMTP',
      'host': 'smtp.mailgun.org',
      'secureConnection': true, // use SSL
      'port': 25, // port for secure SMTP
      'auth': {
        'user': 'postmaster@yourdomain.com',
        'pass': 'xxxxxxxxxxxxxxxxx'
      }
    }
    ]
  }
};
