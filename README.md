# **VA-server**
VA server

## Getting Started
```
- release version
git clone -b va/master https://github.com/amuzlab/node-server.git va

- devel version
git clone -b va/develop https://github.com/amuzlab/node-server.git va-dev

npm install
```

### Branch naming convention
```
git branch <project name>/<sub branch name>

ex) git branch va/master
ex) git branch va/develop
```

### Annotated tag naming convention
```
git tag -a <project name>/<service name>/<tag name>

ex) git tag -a va/master/1.0.0
```

### Create docs
```
npm run create-doc
```

### Create package
```
npm pack
```