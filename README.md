# 12-factor-app-example-backend-nodejs
Example of a backend implemented in Node.js according to the 12 factor app manifest.

## Setup

### Database

#### Start Database

```bash
docker run --name 12-factor-app-example-database-mongo -d mongo --auth
```

#### Initialize Database

Connect To Database:

```bash
docker exec -it 12-factor-app-example-database-mongo mongo admin
```

Create admin user

```
> db.createUser({ user: 'my-user', pwd: 'my-password', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] });
Successfully added user: {
	"user" : "my-user",
	"roles" : [
		{
			"role" : "userAdminAnyDatabase",
			"db" : "admin"
		}
	]
}

```

You don't have permissions yet, e.g. you can not show database users

```
> show users
2018-02-23T06:54:48.568+0000 E QUERY    [thread1] Error: not authorized on admin to execute command { usersInfo: 1.0, $db: "admin" } :
_getErrorWithCode@src/mongo/shell/utils.js:25:13
DB.prototype.getUsers@src/mongo/shell/db.js:1686:1
shellHelper.show@src/mongo/shell/utils.js:796:9
shellHelper@src/mongo/shell/utils.js:703:15
@(shellhelp2):1:1

```

Login as the previously created user

```
> db.auth('my-user', 'my-password')
1
```

Now you have permissions to e.g. show database users

```
> show users
{
    "_id" : "admin.my-user",
    "user" : "my-user",
    "db" : "admin",
    "roles" : [
        {
            "role" : "userAdminAnyDatabase",
            "db" : "admin"
        }
    ]
}
```

##### Reconnect To Admin Database

```bash
docker run -it --rm \
    --link 12-factor-app-example-database-mongo:mongo \
    mongo mongo -u my-user -p my-password --authenticationDatabase admin \
    12-factor-app-example-database-mongo/admin
```

You are logged-in as admin `my-user` and have permissions to e.g. show database users

```
> show users
{
    "_id" : "admin.my-user",
    "user" : "my-user",
    "db" : "admin",
    "roles" : [
        {
            "role" : "userAdminAnyDatabase",
            "db" : "admin"
        }
    ]
}
```


### Backend

```bash
docker run --rm \
    --env MONGO_URI=mongodb://mongo:27017/12-factor-app \
    --name 12-factor-app-example-backend-nodejs \
    --link 12-factor-app-example-database-mongo:mongo \
    maiermic/12-factor-app-example-backend-nodejs:latest
```