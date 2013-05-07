/**
* Javascript for adding (finding/creating) projects to your project explorer
* Functions
*	projectDialog(): opens a dialog for creating projects
*	createProject(): opens a window for creating projects, loads new project
*	removeProject(): removes project from explorer and server 
*	openProject(): 	 opens project from project explorer into Project div
*/

var socket =  io.connect('http://69.251.42.152:8000');

/**
* Opens window for creating project 
*/
function projectDialog() {
	console.log("pressed project Dialog")
	//create a div absolutely positioned at center of page
    document.getElementById( 'openProject' ).style.display = 'block';    
    
    var openDialog = document.getElementById( 'openProject' );
    
    openDialog.style.left = ( ( window.innerWidth / 2 ) - ( openDialog.scrollWidth / 2 ) ) + 'px';
    openDialog.style.top = ( ( window.innerHeight / 2 ) - ( openDialog.scrollHeight / 2 ) ) + 'px';
}

/*
* Adds project to server project database
* Also adds project to users project explorer
*/
function createProject(name) {
	socket.emit("create_project",{name:$("#createProjectName").val()})
	console.log("emitted a create_project message");
}

function removeProject(name) {

}

function openProject(project){
	for(widget in project.widgets){

	}
}

//listen for socket messages for appending projects to the project list
socket.on("add_project",function(project){
	var project_list = $("#project_list")
	var project_div = document.createElement("div");
	project_div.innerHTML = project.name
	project_div.className = "project"

	project_div.setAttribute("onclick","console.log('hahahaha')")
	project_list.append(project_div)
	console.log(project)
})
