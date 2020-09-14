class DOMHelper {
  static clearEventListeneres(element) {
    const clonedElement = element.cloneNode(true);
    // Clonning the element with itself we ditch any old event handlers so no memory leaks when adding new event handlers to the button
    element.replaceWith(clonedElement);
    return clonedElement;
  }
  static moveElement(elementId, newDestinationSelector) {
    const element = document.getElementById(elementId);
    const destinationElement = document.querySelector(newDestinationSelector);
    destinationElement.append(element);
  }
}

// Adding a base class
class Component {
  constructor(hostElementId, insertBefore = false) {
    if (hostElementId) {
      this.hostElement = document.getElementById(hostElementId);
    } else {
      this.hostElement = document.body;
    }
    this.insertBefore = insertBefore;
  }
  detached() {
    if (this.element) {
      // "this" always refers to the subclass
      this.element.remove(); //modern syntax
      //this.element.parentElement.removeChild(this.element); // old syntax it will work in all browsers
    }
  }

  attached() {
    //document.body.append(this.element);
    this.hostElement.insertAdjacentElement(
      this.insertBefore ? 'beforebegin' : 'beforeend',
      this.element
    );
  }
}

class Tooltip extends Component {
  constructor(closeNotifierFunction) {
    // as now Component is a generic class to append DOM elements we could add any ids i.e. super('active-projects');  and elements will be added to before the end of the 'active-projects' section
    super(); // we do not need to pass values as we have validation and default values in the base class
    this.closeNotifier = closeNotifierFunction;
    this.create();
  }

  // This is an alternative to bind "this" in tooltipElement.addEventListener('click', this.closeTooltip.bind(this));
  // with arrow functions "this" aways refers to the class
  // This is ok for this little funciton but is not the more efficient solution as this arrow function gets created for every isntance of tooltip
  closeTooltip = () => {
    this.detached();
    this.closeNotifier();
  };

  create() {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'card';
    tooltipElement.textContent = 'DUMMY!';
    tooltipElement.addEventListener('click', this.closeTooltip);
    this.element = tooltipElement;
  }
}

class ProjectItem {
  hasActiveTooltip = false;
  constructor(id, updateProjectListsFunciton, type) {
    this.id = id;
    this.updateProjectListsHandler = updateProjectListsFunciton;
    this.connectMoreInfoButton();
    this.connectSwitchButton(type);
  }

  showMreInfoHandler() {
    // we do not want to open a tooltip more than once
    if (this.hasActiveTooltip) {
      return;
    }
    const tooltip = new Tooltip(() => {
      this.hasActiveTooltip = false;
    });
    tooltip.attached();
    this.hasActiveTooltip = true;
  }

  connectMoreInfoButton() {
    const projectItemElement = document.getElementById(this.id);
    const moreInfoBtn = projectItemElement.querySelector(
      'button:first-of-type'
    );
    moreInfoBtn.addEventListener('click', this.showMreInfoHandler);
  }

  connectSwitchButton(type) {
    const projectItemElement = document.getElementById(this.id);
    let switchBtn = projectItemElement.querySelector('button:last-of-type');
    // In case this button had already an event handler we clear it to avoid memory leaks and errors
    switchBtn = DOMHelper.clearEventListeneres(switchBtn);
    // If project was moved update button text
    switchBtn.textContent = type === 'active' ? 'Finish' : 'Activate';
    // updateProjectListsHandler points to the switchProject function in ProjectList class
    switchBtn.addEventListener(
      'click',
      this.updateProjectListsHandler.bind(null, this.id)
    );
  }

  update(updateProjectListsFun, type) {
    this.updateProjectListsHandler = updateProjectListsFun;
    this.connectSwitchButton(type);
  }
}

class ProjectList {
  projects = [];

  constructor(type) {
    this.type = type;
    const prjItems = document.querySelectorAll(`#${this.type}-projects li`);
    for (const prjItem of prjItems) {
      this.projects.push(
        new ProjectItem(prjItem.id, this.switchProject.bind(this), this.type)
      );
    }
    console.log(this.projects);
  }

  setSwitchHandlerFunction(switchHandlerFunction) {
    this.switchHandler = switchHandlerFunction;
  }

  addProject(project) {
    // "this" was set in init() and corresponds not to the list that the project currently belongs but the other
    this.projects.push(project);
    DOMHelper.moveElement(project.id, `#${this.type}-projects ul`);
    // We update the project with a new handler as now it belongs to the "this" list
    project.update(this.switchProject.bind(this), this.type);
  }

  // This method is sent as the function to be called when activate or finished button is click
  // and the  lets us communicate  with the ProjectItem class see ProjectList Constructor and updateProjectListsHandler in ProjectItem class
  switchProject(projectId) {
    this.switchHandler(this.projects.find((p) => p.id === projectId));
    this.projects = this.projects.filter((p) => p.id !== projectId);
  }
}

class App {
  static init() {
    const activeProjectsList = new ProjectList('active');
    const finishedProjectsList = new ProjectList('finished');
    // Active projects need to be added to the finished list the handler will point to the addProject funciton
    // and "this" will be de finishedProjectsList when the function is called
    activeProjectsList.setSwitchHandlerFunction(
      finishedProjectsList.addProject.bind(finishedProjectsList)
    );
    // Finished projects need to be added to the active list the handler will point to the addProject funciton
    // and "this" will be de activeProjectsList when the function is called
    finishedProjectsList.setSwitchHandlerFunction(
      activeProjectsList.addProject.bind(activeProjectsList)
    );
  }
}

App.init();
