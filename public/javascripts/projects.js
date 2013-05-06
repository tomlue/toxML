/**
* Javascript for adding (finding/creating) projects to your package explorer
* Functions
*	projectDialog(): opens a dialog for creating projects
*	createProject(): opens a window for creating projects, loads new project
*	removeProject(): removes project from explorer and server 
*	openProject(): 	 opens project from project explorer into Project div
*/

/**
* Opens window for creating project 
*/
function projectDialog() {
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
	console.log("heya")

}

function removeProject(name) {

}

function openProject(){

}