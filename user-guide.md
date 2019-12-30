# User Guide

#### Table of Contents   
[**Gameplay**](#gameplay)  
&nbsp;&nbsp;&nbsp;&nbsp;[Account Creation](#account-creation)  
&nbsp;&nbsp;&nbsp;&nbsp;[Resources](#resources)    
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Uploading Resources](#uploading-resources)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Cloning Resources](#cloning-resources)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Viewing and Editing Resources](#viewing-and-editing-resources)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Sharing Resources](#sharing-resources)  
&nbsp;&nbsp;&nbsp;&nbsp;[World Editing](#world-editing)    
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Creating Entities](#creating-entities)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Deleting Entities](#deleting-entities)    
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Editing Entities](#editing-entities)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Adding Components](#adding-components)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Removing Components](#removing-components)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Renaming Components](#renaming-components)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Enabling/Disabling Components](#enablingdisabling-components)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Controlling/Releasing Entities](#controllingreleasing-entities)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Creating Prefabs](#creating-prefabs)  
&nbsp;&nbsp;&nbsp;&nbsp;[Script Running](#script-running)    
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[REPL-Style Script Execution](#repl-style-script-execution)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Resource Script Execution](#resource-script-execution)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Applied Resource Script Execution](#applied-resource-script-execution)  

## Gameplay
### Account Creation
The first step to getting started with Scriptbox is creating an account. Accounts are kept on a login server that is separate from the game servers. Most of the information for the game (like the uploaded resources) is stored per-server. The account itself is essentially there to ensure that you are the only one who can connect to a server using your username.

To create an account, simply click "Sign Up", enter your account information, and then click "Sign Up" again. You will see a message indicating if your account creation was successful.

After creating an account, simply click "Log In" and log in using your account credentials.
### Resources
In Scriptbox, a "resource" is anything you upload or copy from the server for ingame use. This includes executable scripts, components, images, sounds, and prefabs. All of your resources are displayed at the bottom of the screen.

#### Uploading Resources
To upload a resource, click on "Upload..." inside of your resource window. A window will pop up where you can upload the resource you wish to upload. You can upload scripts, components, images, and audio files. Prefabs cannot be uploaded, but rather must be created from an object in the game.

- You can upload multiple resources at once by selecting multiple files in the file upload window.
#### Cloning Resources
[Default resources](#default-resources) or [shared resources](#sharing-resources) can be cloned from the server's resource repository. This repository can be accessed by clicking "Find Resources!". Simply type a search term into the search bar and hit enter to show listings in the repository that match the search term.

- Shared items are tagged based on their name and description

To clone an item from the repository, click on the item in the left side of the repository. From there, scroll down on the right side and click "Clone" to clone the resource into your personal resource listing. Once a resource is cloned, you can modify and use it freely.
#### Viewing and Editing Resources

When you inspect a resource in your resource listing, you will see multiple fields on every resource. Some of these fields will be text entries which you will be able to modify.

- Name: The name shown in the resource list.
- ID: The internal ID of the resource.
- Filename: The name of the file for the resource. Used in some cases to refer to the file.
- Creator: The original creator of the resource.
- Description: A description of the resource.

A resource may also reuploaded. This will replace the actual file the resource contains with a new file, also changing the resource type if necessary. This is also where a resource can be deleted.

Additionally, script resources can have their source code edited and can be [executed](#resource-script-execution). 

##### Sharing Resources

When a resources is selected, you can share it with other players on the server by clicking the checkbox next to "Share". Once a resource is shared, it will be tagged based on its name and description. A resource can also be un-shared by unchecking the checkbox.

- Editing or unsharing a shared resource will not affect copies which other players have cloned.

### World Editing
#### Creating Entities

Placing entities can be done by selecting the "Place" tool on the right and clicking somewhere in the game screen.
- If a prefab is selected in the resource list, it will create the entity from the prefab.
- Left clicking will place the entity exactly where you click. Right clicking will snap the entity to a 32x32 grid.

#### Deleting Entities

Deleting entities can be done by clicking the "Erase" tool on the right and clicking an entity on the game screen.
- If multiple entities are placed in the same location, the entity displayed on the top will be deleted first.

#### Editing Entities

Editing entities can be done by clicking the "Edit" tool on the right and clicking an entity on the game screen. From here, a list of the entity's components will be shown in the left of the inspection window. These can be clicked to display the component information on the right, where the component information can be viewed.

##### Adding Components

To add a component to an entity, you will need to have the component you want to add inside of your resource listing. First use the "Edit" tool to open the entity inspection window. Then, with the component you wish to add selected in the resource listing, click the "Apply..." button inside of the entity inspection window. This will execute the script through [applied resource script execution](#applied-resource-script-execution), and then add the resulting component to the entity.

##### Removing Components

To remove a component, from the entity inspection window, select the component you wish to remove, and scroll down on the right and click the "Delete" button. This will unload and remove the component from the entity.

##### Renaming Components

To rename a component, from the entity inspection window, select the component you wish to rename, click the editing text box on the right and replace the current name with the new name, and hit enter or click on something else. This will change the name of the component if a component of that name does not currently exist.

##### Enabling/Disabling Components

To disable or enable a component, from the entity inspection window, select the component you wish to rename, and then on the right click the checkbox next to the component's name above the component information. This is most useful for re-enabling a component when it has been disabled because it encountered an error.

#### Controlling/Releasing Entities

To control or release an entity, from the entity inspection window, click the "Control" or "Release" button depending on whether you are already controlling an entity or not. When an entity is controlled, scripts using the global `entity` will refer to that entity, and if the entity has a module named "control" then your inputs will be directed to that component. 
- When you are not controlling any entity, you will be in a "soul" state. In this state you will be displayed onscreen but you will not count as an entity, and so you will not be modifiable. You will remain in this state until you control another entity.

#### Creating Prefabs

To create a prefab, from the entity inspection window, click "Make Prefab". This will create a prefab resource in your resource listing named "New Prefab". This prefab will have the same component information as the entity it was created from, allowing you to create many copies of a particular entity.

### Script Running

There are three main ways in which scripts can be executed in Scriptbox. These different methods of script execution have different properties, typically for different situations.

#### REPL-Style Script Execution

Arbitrary code can be executed REPL-Style by typing a message into the chat beginning with `>>` followed by the code to be executed. This is the simplest and quickest way to execute code on the server, but is primarily useful for one-time script executions.
- The global `entity` will refer to the entity you're controlling if you are controlling one, otherwise it will be `undefined`.
- Multiple lines must be separated with a `;`.
- The last value evaluated will be output to the chat if it is not `undefined`.

#### Resource Script Execution

Resource script execution is done through the resource listing menu. When a script resource is selected, near the bottom there will be a "Run" button. Clicking this button will execute the script. If the script exports a component, any existing entities with that component will be re-instantiated with the rebuilt version of the component.

- Arguments can be supplied through the textbox next to the "Run" button. These arguments are all strings, and separated by spaces. These arguments can also contain spaces by using double quotes, for example `"orange juice" "pear jelly" "apple sauce"`.
- The global `entity` will refer to the entity you're controlling if you are controlling one, otherwise it will be `undefined`.

#### Applied Resource Script Execution

Applied resource script execution is done through the entity inspection menu. When an entity is inspected using the "Edit" tool, select the resource to apply to the entity in the resource listing window and click the "Apply..." button in the entity inspection window. This will execute the script similar to standard Resource Script Execution, with a couple of notable differences:
- Execution arguments cannot be set
- The `entity` global will refer to the entity the script is being applied to
- If a class is the default export of the script, it will be added to the selected entity as a component.
