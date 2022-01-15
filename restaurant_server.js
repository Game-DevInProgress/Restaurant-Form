const http = require('http');
const pug = require('pug');
const fs = require("fs");

let restaurant_list = [];
let currentRestaurant;

const server = http.createServer((request,response) => {
    if(request.method === "GET"){
        if(request.url === "/" || request.method === "/home"){
            let page = pug.renderFile("pages/homepage.pug", {restaurants:restaurant_list});//Generates the homepage of the server
            response.setHeader("Content-Type", "text/html");
            response.statusCode = 200;
            response.end(page);
        }else if(request.url === "/orderform"){
            let page = pug.renderFile("pages/order_page.pug", {restaurant_name: currentRestaurant.name});//Renders the menu for the user to select items using Pug
            response.setHeader("Content-Type", "text/html");
            response.statusCode = 200;
            response.end(page);
        
        }else if(request.url === "/stats"){
            let stats = pug.renderFile("pages/stats_page.pug",{list:restaurant_list})//Renders a page for the user to see the stats using Pug
            response.setHeader("Content-Type", "text/html");
            response.statusCode = 200;
            response.end(stats);
        }else if(request.url === "/restaurantName"){
            response.statusCode = 200;
            let nameList = [];
            for(let name of restaurant_list){//Generates the list of restaurant names and gives it to the client
                nameList.push(name.name);
            }
            response.write(JSON.stringify(nameList));
            response.end();
        }else if(request.url === "/add.png"){
            fs.readFile("add.png", function(err, data){
				if(err){
					response.statusCode = 500;
					response.write("Server error. Cannot find add.png");
					response.end();
					return;
				}
				response.statusCode = 200;
				response.setHeader("Content-Type", "text/css");
				response.write(data);
				response.end();
			});
        }else if(request.url === "/remove.png"){
            fs.readFile("remove.png", function(err, data){
				if(err){
					response.statusCode = 500;
					response.write("Server error. Cannot find remove.png");
					response.end();
					return;
				}
				response.statusCode = 200;
				response.setHeader("Content-Type", "text/css");
				response.write(data);
				response.end();
			});
        }else if(request.url === "/client.js"){
            fs.readFile("client.js", function(err, data){
				if(err){
					response.statusCode = 500;
					response.write("Server error.");
					response.end();
					return;
				}
				response.statusCode = 200;
				response.setHeader("Content-Type", "text/javascript");
				response.write(data);
				response.end();
			});
        }else{
            response.statusCode = 404;
            response.write("Unknown resource.");
            response.end();
        }
    }else if(request.method === "POST"){
        if(request.url === "/currentRestaurant"){
            let body = "";

			request.on('data', (data) => {
				body+=data;
			});

			request.on('end', () => {
				const requestObject = JSON.parse(body);
                
                const index = parseInt(requestObject);
                
				currentRestaurant = restaurant_list[index];//Current restaurant is equal to what index the user selected
                
                response.statusCode = 200;
                response.write(JSON.stringify(currentRestaurant));
				response.end();
			});
        }else if(request.url === "/currentOrder"){
            let body = "";

			request.on('data', (data) => {
				body+=data;
			});

			request.on('end', () => {
				const requestObject = JSON.parse(body);
                let itemlist = {};
                let total = 0;
                let f = Object.keys(currentRestaurant.menu);

                //loop to get all the item names from the restaurant to match it with the order being sent in
                for(let i of f){
                    for(let j in currentRestaurant.menu[i]){
                        itemlist[j] = currentRestaurant.menu[i][j];
                    }
                }
                restaurant_list[currentRestaurant.index].orders++;//Add to the total number of orders
                for(let item in requestObject){
                    total += itemlist[item].price * requestObject[item];//Add (the price of the item * quantity) to total
                    if(itemlist[item].name in restaurant_list[currentRestaurant.index].orderItems){
                        restaurant_list[currentRestaurant.index].orderItems[itemlist[item].name]+= requestObject[item];//If its already been ordered just add to the quantity already there
                    }
                    else{
                        restaurant_list[currentRestaurant.index].orderItems[itemlist[item].name]= requestObject[item];
                    }
                }
                total = total + restaurant_list[currentRestaurant.index].delivery_fee + (total * 0.1)//Gets the final total of everything and adds tax and delivery fee
                restaurant_list[currentRestaurant.index].total += total;// Add to the restuarants total money earned
                response.statusCode = 200;
				response.end();
			});
        }
    }else{
        response.statusCode =404;
        response.write("Unknown resource.");
        response.end();
    }
});

fs.readdir("./restaurants", (err,files) => {
    let restaurantID = 0;
    if(err) return console.log(err);
    for (let i = 0; i < files.length; i++) {
        let restaurant = require("./restaurants/" + files[i]);

        restaurant.orders = 0;//How many orders the restaurant has
        restaurant.orderItems = {};//All the items that were ordered
        restaurant.index = restaurantID;
        restaurant.total = 0;//Total of all orders from this restaurant
        restaurant_list[restaurantID] = restaurant;
        restaurantID++;
    }
    currentRestaurant = restaurant_list[0];
    server.listen(3000);
    console.log('Server running at http://127.0.0.1:3000/');
});