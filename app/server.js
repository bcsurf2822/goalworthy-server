const http = require('http');
const finalHandler = require('finalhandler');
const queryString = require('querystring');
const url = require('url');
const Router = require('router');
const bodyParser = require('body-parser');
const fs = require('fs');
// State holding variables
let goals = [];
let user = {};
let users = [];
let categories = [];

// Setup router
let myRouter = Router();
myRouter.use(bodyParser.json());

// This function is a bit simpler...
http.createServer(function (request, response) {
  myRouter(request, response, finalHandler(request, response))
}).listen(3001, () => {
  console.log("Node server runing on port 3001")
  // Load dummy data into server memory for serving
  goals = JSON.parse(fs.readFileSync("goals.json","utf-8"));
  
  // Load all users into users array and for now hardcode the first user to be "logged in"
  users = JSON.parse(fs.readFileSync("users.json","utf-8"));
  user = users[0];
  
  // Load all categories from file
  categories = JSON.parse(fs.readFileSync("categories.json","utf-8"));
});

const saveCurrentUser = (current) => {
  // set hardcoded "logged in" user
  users[0] = current;
  fs.writeFileSync('initial-data/users.json', JSON.stringify(users), "utf-8");
}
//-------------------------------------------------------------------------------------------------------------------------------
// Notice how much cleaner these endpoint handlers are...
myRouter.get('/v1/goals', function(request,response) {
  // Get our query params from the query string
  const {query, sort} = queryString.parse(url.parse(request.url).query);
  let goalsToReturn = [];
  if (query !== undefined) {
    goalsToReturn = goals.filter(goal => goal.description.includes(query));
    if (!goalsToReturn) {
      response.writeHead(404, "There are no Goals");
      return response.end();
    }
  } else {
    goalsToReturn = goals;
  }
  if (sort !== undefined) {
    goalsToReturn.sort((a, b) => a[sort] - b[sort]);
  }

  response.writeHead(200, {"Content-Type": "application.json"});

  // Return all our current goal definitions (for now)
  return response.end(JSON.stringify(goalsToReturn));
});
//--------------------------------------------------------------------------------------------------------------------------------
//Get me
myRouter.get("/v1/me", (request, response) => {
  if (!user) {
    response.writeHead(404, "That user does not exist");
    return response.end();
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  return response.end(JSON.stringify(user));
});

//--------------------------------------------------------------------------------------------------------------------------------

// See how i'm not having to build up the raw data in the body... body parser just gives me the whole thing as an object.
// See how the router automatically handled the path value and extracted the value for me to use?  How nice!

//Accept
myRouter.post('/v1/me/goals/:goalId/accept', function(request,response) {
  // Find goal from id in url in list of goals
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  if (!goal) {
    response.writeHead(404, "goal doesn't exist");
    return response.end();
  }
  // Add it to our logged in user's accepted goals
  response.writeHead(200);
  user.acceptedGoals.push(goal); 
  // No response needed other than a 200 success
  saveCurrentUser(user);
  return response.end();
});

// //Achieve
myRouter.post('/v1/me/goals/:goalId/achieve', function(request, response) {
  let goal = goals.find((goal) => {
    return goal.id == request.params.goalId
  })
  if (!goal) {
    response.statusCode = 400
    return response.end("No goal with that ID found.")
  }
  user.achievedGoals.push(goal);
  return response.end();
})

//Challenge
myRouter.post('/v1/me/goals/:goalId/challenge/:userId', function(request,response) {
  // Find goal from id in url in list of goals
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  // Find the user who is being challenged in our list of users
  let challengedUser = users.find((user)=> {
    return user.id == request.params.userId
  })
  // Make sure the data being changed is valid
  if (!goal) {
    response.statusCode = 400
    return response.end("No goal with that ID found.")
  }
  // Add the goal to the challenged user
  challengedUser.challengedGoals.push(goal); 
  // No response needed other than a 200 success
  return response.end();
});

// //Gift
myRouter.post('/v1/me/goals/:goalId/gift/:userId', function(request,response) {
  // Find goal from id in url in list of goals
  let goal = goals.find((goal)=> {
    return goal.id == request.params.goalId
  })
  // Find the user who is being challenged in our list of users
  let giftedUser = users.find((user)=> {
    return user.id == request.params.userId
  })
  // Make sure the data being changed is valid
  if (!goal) {
    response.statusCode = 400
    return response.end("No goal with that ID found.")
  }
  // Add the goal to the challenged user
  response.statusCode = 200
  giftedUser.giftedGoals.push(goal); 
  saveCurrentUser(giftedUser);
  // No response needed other than a 200 success
  return response.end();
});


//-----------------------------------------------------------------------------------------------------------------------------
//Get Categories
myRouter.get('/v1/categories', function(request, response) {
  const parseUrl = queryString.parse(url.parse(request.url).limit)
  const {query, sort} = queryString.parse(parseUrl.query);
  let categoriesToReturn = [];
  if (query !== undefined) {
    categoriesToReturn = categories.filter(category => category.name.includes(query));

    if (!categoriesToReturn) {
      response.writeHead(404, "There are no goals to Return meow");
      return response.end();
    }
  } else {
    categoriesToReturn = categories;
  }

if (sort !== undefined) {
  categoriesToReturn.sort((a, b) => a[sort] -b[sort]);
}

response.writeHead(200, {"Content-Type": "application/json"});
return response.end(JSON.stringify(categoriesToReturn))
})

//GET ALL GOALS IN CATEGORY
myRouter.get("/v1/categories/:categoryId/goals", (request, response) => {
  const { categoryId } = request.params;
  const category = categories.find(category => category.id == categoryId);
  if (!category) {
    response.writeHead(404, "That category does not exist");
    return response.end();
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  const relatedGoals = goals.filter(
    goals => goals.categoryId === categoryId
  );

  console.log(relatedGoals)
  return response.end(JSON.stringify(relatedGoals));
});

