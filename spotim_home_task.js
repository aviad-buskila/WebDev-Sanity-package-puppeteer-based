const puppeteer = require('puppeteer');
const test_configuration = require('./assests.json');
const page_elements = require('./elements.json');
const scroll = require('puppeteer-autoscroll-down')

// async function which initializes chromium instance and returns its browser and page objects, views are maximized 
async function initialize_instance() {
  let browser = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  let page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1040 });
  return [browser, page];
}


// TS-01, a user navigates to a publisher page using Spot.IM link, and it is loaded successfully.
// Navigates to publisher page, and wait for 200 response (in case of a script which is being loaded by the publisher, I would have ping it)
// You can change the url in assests.json in order to view a failed test, make sure to undo, in order for other tests to pass
async function loaded() {
  let flag = false;
  properties = await initialize_instance();
  let page = await properties[1];
  let browser = await properties[0];
  page.on('response', response => {flag = response.ok()});
  await page.goto(test_configuration.publisher_page);
  await browser.close();
  let lodaed_result = !flag? 'failed to load publisher page' : 'publisher page was loaded successfully'; 
  console.log(lodaed_result); 
};

// TS-03, a guest uses a correct pair of username and password and logs in successfully with the Log In link in the SpotIM component.
// Navigates to publisher page, logs in using correct pair of user name and password, and ping the user profile element. Timeout is set to 5 seconds in assets.json
// You can change the password in assests.json in order to view a failed test
async function login() {
    properties = await initialize_instance();
    let page = await properties[1];
    let browser = await properties[0];
    await page.goto(test_configuration.publisher_page);
    let login_button = await page.waitForSelector(page_elements.login_button_class)
    login_button.click();
    await page.waitForSelector(page_elements.email_address_tag)
    await page.focus(page_elements.email_address_tag);
    await page.keyboard.type(test_configuration.user_name);
    await page.focus(page_elements.email_password_tag);
    await page.keyboard.type(test_configuration.password);
    await page.click(page_elements.login_button);
    try {
        await page.waitForSelector(page_elements.logged_in_indication, {timeout: test_configuration.timeout_treshold})
        console.log('login scenario passed');
    }
    catch (e) {
        console.log('login scenario failed reason: ' + e);
    }
    await browser.close();
  };


  // TS-12, a user scrolls down to the bottom of a loaded page, click Show More Comments to load the next chunk of posts
  // Navigates to publisher page, scrolls down (you should run `npm i puppeteer-autoscroll-down` first in your terminal) and click on "Show More Comments" and checks if the posts count changed
  // I did not successed to call the class and string from the elemnts.json file here inside of the anonymized function, I know it's not best practice, but didn't manage to solve it JavaScript (it's more staright forward in Python :-) )
  async function pagination() {
    properties = await initialize_instance();
    let page = await properties[1];
    let browser = await properties[0];
    await page.goto(test_configuration.publisher_page);
    let show_more_comments_button = await page.waitForSelector(page_elements.show_more_comments_button_tag);
    await scroll(page);
    let perliminary_messages = await page.$$(page_elements.posts_container);
    let perliminary_messages_counter = perliminary_messages.length;
    await show_more_comments_button.click();
    await page.waitFor(() => {
        let span = document.querySelector("div[data-spot-im-class='load-more-messages']")
        if(span.innerText == 'Show More Comments'){
            return true;
        } else {
            return false;
        }
    })
    let current_messages = await page.$$(page_elements.posts_container);
    let current_messages_counter = current_messages.length;
    await browser.close();
    let pagination_functionallity = perliminary_messages_counter < current_messages_counter? 'pagination test passed' : 'pagination test failed'; 
    console.log(pagination_functionallity);
  };


loaded();
login();
pagination();

