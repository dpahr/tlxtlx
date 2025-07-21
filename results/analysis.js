import fs from 'fs';

const filePath = 'tlxtlx_all.json'
let userData = {};

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading tlxtlx_all.json:', err);
        return;
    }
    try {
        const jsonData = JSON.parse(data);
        
        // POPULATE DICTIONARY OF RELEVANT THINGS
        for (let i in jsonData){
            let entry = jsonData[i];
            if (entry["rejected"]) {continue;}
            if (Object.keys(entry["answers"]).length < 5) {continue;}
            userData[entry["participantId"]] = {};

            // which experiment setup was used?
            if (Object.keys(entry["answers"]).includes("intro-task-RTLX_3")){
                userData[entry["participantId"]]["experiment_setup"] = "short";
            } else if (Object.keys(entry["answers"]).includes("source-of-load_4")){
                userData[entry["participantId"]]["experiment_setup"] = "mid";
            } else {
                userData[entry["participantId"]]["experiment_setup"] = "long";
            }

            // which task did the participant do?
            userData[entry["participantId"]]["task"] = Object.keys(entry["answers"])[2];

            // how much time did the participant spend on the task?
            userData[entry["participantId"]]["time_spent_on_task"] = entry["answers"][userData[entry["participantId"]]["task"]]["endTime"] - entry["answers"][userData[entry["participantId"]]["task"]]["startTime"];

            // analyze the first tlx
            const answerKeys = Object.keys(entry["answers"]);
            userData[entry["participantId"]]["tlx"] = {};

            // if the experiment setup is "short", the first TLX is the RTLX, otherwise it is the TLX
            if (userData[entry["participantId"]]["experiment_setup"] === "short") {
                userData[entry["participantId"]]["tlx"]["vals"] = entry["answers"][answerKeys[4]]["answer"];

                userData[entry["participantId"]]["tlx"]["weighted_score"] = 0;
                for (let k in userData[entry["participantId"]]["tlx"]["vals"]){
                    let k2 = k.replace(/ /g, "-").toLowerCase();
                    userData[entry["participantId"]]["tlx"]["weighted_score"] += parseInt(userData[entry["participantId"]]["tlx"]["vals"][k2], 10);
                }
                userData[entry["participantId"]]["tlx"]["weighted_score"] /= 6

                userData[entry["participantId"]]["tlx"]["time_spent_on_tlx"] = entry["answers"][answerKeys[4]]["endTime"] - entry["answers"][answerKeys[3]]["startTime"];

            } else if (userData[entry["participantId"]]["experiment_setup"] === "long") {
                userData[entry["participantId"]]["tlx"]["weights"] = {
                    "Mental Demand": 0,
                    "Physical Demand": 0,
                    "Temporal Demand": 0,
                    "Performance": 0,
                    "Effort": 0,
                    "Frustration": 0
                };
                for (let j = 4; j < 19; j++) {
                    const key = answerKeys[j];
                    let val = Object.values(entry["answers"][key]["answer"])
                    userData[entry["participantId"]]["tlx"]["weights"][val]++;
                }
                // console.log(answerKeys[19])
                userData[entry["participantId"]]["tlx"]["vals"] = entry["answers"][answerKeys[19]]["answer"];

                // compute weighted score
                userData[entry["participantId"]]["tlx"]["weighted_score"] = 0
                for (let k in userData[entry["participantId"]]["tlx"]["weights"]){
                    let k2 = k.replace(/ /g, "-").toLowerCase();
                    userData[entry["participantId"]]["tlx"]["weighted_score"] += parseInt(userData[entry["participantId"]]["tlx"]["weights"][k], 10) * parseInt(userData[entry["participantId"]]["tlx"]["vals"][k2], 10);
                }
                userData[entry["participantId"]]["tlx"]["weighted_score"] /= 15;

                userData[entry["participantId"]]["tlx"]["time_spent_on_tlx"] = entry["answers"][answerKeys[19]]["endTime"] - entry["answers"][answerKeys[4]]["startTime"];
            } else if (userData[entry["participantId"]]["experiment_setup"] === "mid") {
                userData[entry["participantId"]]["tlx"]["weights"] = {
                    "Mental Demand": 0,
                    "Physical Demand": 0,
                    "Temporal Demand": 0,
                    "Performance": 0,
                    "Effort": 0,
                    "Frustration": 0
                };
                
                let weigths = entry["answers"]["source-of-load_4"]["answer"];
                
                for (let j in weigths) {
                    let v = weigths[j];
                    if (v === "Mental demand") v = "Mental Demand";
                    else if (v === "Physical demand") v = "Physical Demand";
                    else if (v === "Temporal demand") v = "Temporal Demand";

                    userData[entry["participantId"]]["tlx"]["weights"][v]++;
                }

                // now work on vals
                userData[entry["participantId"]]["tlx"]["vals"] = entry["answers"][answerKeys[5]]["answer"];

                // // compute weighted score
                userData[entry["participantId"]]["tlx"]["weighted_score"] = 0
                for (let k in userData[entry["participantId"]]["tlx"]["weights"]){
                    let k2 = k.replace(/ /g, "-").toLowerCase();
                    userData[entry["participantId"]]["tlx"]["weighted_score"] += parseInt(userData[entry["participantId"]]["tlx"]["weights"][k], 10) * parseInt(userData[entry["participantId"]]["tlx"]["vals"][k2], 10);
                }
                userData[entry["participantId"]]["tlx"]["weighted_score"] /= 15;

                userData[entry["participantId"]]["tlx"]["time_spent_on_tlx"] = entry["answers"][answerKeys[5]]["endTime"] - entry["answers"][answerKeys[4]]["startTime"];
            }
            
            // analyze the second tlx
            userData[entry["participantId"]]["tlxtlx"] = {"weights": {
                "Mental Demand": 0,
                "Physical Demand": 0,
                "Temporal Demand": 0,
                "Performance": 0,
                "Effort": 0,
                "Frustration": 0
            }};
            
            const tlxIndex = answerKeys.findIndex(key => key.includes("TLX-TLX"));
            for (let j = tlxIndex + 1; j < answerKeys.length - 2; j++) {
                const key = answerKeys[j];
                // console.log(entry["answers"][key]);
                let val = Object.values(entry["answers"][key]["answer"])
                // console.log('val:', val);

                userData[entry["participantId"]]["tlxtlx"]["weights"][val]++;
            }

            userData[entry["participantId"]]["tlxtlx"]["vals"] = entry["answers"][answerKeys[answerKeys.length - 2]]["answer"];
            // make sure all values are integers
            for (let key in userData[entry["participantId"]]["tlxtlx"]["vals"]) {
                userData[entry["participantId"]]["tlxtlx"]["vals"][key] = parseInt(userData[entry["participantId"]]["tlxtlx"]["vals"][key], 10);
            }
            for (let key in userData[entry["participantId"]]["tlxtlx"]["weights"]) {
                userData[entry["participantId"]]["tlxtlx"]["weights"][key] = parseInt(userData[entry["participantId"]]["tlxtlx"]["weights"][key], 10);
            }

            userData[entry["participantId"]]["tlxtlx"]["weighted_score"] = 0;
            for (let k in userData[entry["participantId"]]["tlxtlx"]["weights"]){
                let k2 = k.replace(/ /g, "-").toLowerCase();
                userData[entry["participantId"]]["tlxtlx"]["weighted_score"] += userData[entry["participantId"]]["tlxtlx"]["weights"][k] * userData[entry["participantId"]]["tlxtlx"]["vals"][k2];
            }

            userData[entry["participantId"]]["tlxtlx"]["weighted_score"] /= 15;
        }

        // Write the userData to a new JSON file
        fs.writeFile('userData.json', JSON.stringify(userData, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing userData.json:', writeErr);
            } else {
                console.log('userData.json has been created successfully.');
            }
        });

        create_whisker_plot_data_per_setup(userData);
        // create_whisker_plot_data(userData);
        // analyze_times(userData);

    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
});

function analyze_times(userData) {
    let data = {
        "short": [],
        "mid": [],
        "long": []
    };
    for (let participantId in userData) {
        const setup = userData[participantId]["experiment_setup"];
        const time_spent_on_tlx = userData[participantId]["tlx"]["time_spent_on_tlx"];
        
        data[setup].push(time_spent_on_tlx);
    }
    // compute median and quartiles
    for (let setup in data) {
        data[setup].sort((a, b) => a - b);
        const n = data[setup].length;
        const median = n % 2 === 0 ? (data[setup][n / 2 - 1] + data[setup][n / 2]) / 2 : data[setup][Math.floor(n / 2)];
        const average = data[setup].reduce((sum, value) => sum + value, 0) / n;
        const q1 = data[setup][Math.floor(n / 4)];
        const q3 = data[setup][Math.floor(3 * n / 4)];
        const min = data[setup][0];
        const max = data[setup][n - 1];

        data[setup] = {
            median: median,
            q1: q1,
            q3: q3,
            min: min,
            max: max,
            average: average
        };
    }
    // console.log("Time spent on TLX per setup:", data);
}

function create_whisker_plot_data(userData) {
    let data = {
        "short": [],
        "mid": [],
        "long": []
    };

    for (let participantId in userData) {
        const setup = userData[participantId]["experiment_setup"];
        const score = userData[participantId]["tlxtlx"]["weighted_score"];
        data[setup].push(score);
    }

    // compute median and quartiles 
    for (let setup in data) {
        data[setup].sort((a, b) => a - b);
        const n = data[setup].length;
        const median = n % 2 === 0 ? (data[setup][n / 2 - 1] + data[setup][n / 2]) / 2 : data[setup][Math.floor(n / 2)];
        const q1 = data[setup][Math.floor(n / 4)];
        const q3 = data[setup][Math.floor(3 * n / 4)];
        const min = data[setup][0];
        const max = data[setup][n - 1];

        data[setup] = {
            median: median,
            q1: q1,
            q3: q3,
            min: min,
            max: max
        };
    }

    // console.log(data)
}

function create_whisker_plot_data_per_setup(userData) {
    let tlxtype = "tlx";

    let bar_fill_styles = ["horizontal lines", "north east lines", "vertical lines", "crosshatch", "dots", "north west lines"];

    let data = {
        "short": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": [],
        },
        "mid": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": []
        },
        "long": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": []
        }
    };
    let weights = {
        "short": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": []
        },
        "mid": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": []
        },
        "long": {
            "performance": [],
            "mental": [],
            "physical": [],
            "temporal": [],
            "effort": [],
            "frustration": []
        }
    }

    const tlx_scores = {
        "short": [],
        "mid": [],
        "long": []
    }

    for (let participantId in userData) {
        const setup = userData[participantId]["experiment_setup"];
        const performance_score = userData[participantId][tlxtype]["vals"]["performance"];
        const mental_score = userData[participantId][tlxtype]["vals"]["mental-demand"];
        const physical_score = userData[participantId][tlxtype]["vals"]["physical-demand"];
        const temporal_score = userData[participantId][tlxtype]["vals"]["temporal-demand"];
        const effort_score = userData[participantId][tlxtype]["vals"]["effort"];
        const frustration_score = userData[participantId][tlxtype]["vals"]["frustration"]; 
        data[setup]["performance"].push(parseInt(performance_score));
        data[setup]["mental"].push(parseInt(mental_score));
        data[setup]["physical"].push(parseInt(physical_score));
        data[setup]["temporal"].push(parseInt(temporal_score));
        data[setup]["effort"].push(parseInt(effort_score));
        data[setup]["frustration"].push(parseInt(frustration_score));
    }

    // console.log(data)
    // console.log("weights", weights)
    // console.log("tlx_scores", tlx_scores)

    // also compute the scores
    for (let participantId in userData) {
        const setup = userData[participantId]["experiment_setup"];
        if (setup === "short" && tlxtype == "tlx") continue;
        const performance_score = userData[participantId][tlxtype]["weights"]["Performance"];
        const mental_score = userData[participantId][tlxtype]["weights"]["Mental Demand"];
        const physical_score = userData[participantId][tlxtype]["weights"]["Physical Demand"];
        const temporal_score = userData[participantId][tlxtype]["weights"]["Temporal Demand"];
        const effort_score = userData[participantId][tlxtype]["weights"]["Effort"];
        const frustration_score = userData[participantId][tlxtype]["weights"]["Frustration"]; 
        weights[setup]["performance"].push(parseInt(performance_score));
        weights[setup]["mental"].push(parseInt(mental_score));
        weights[setup]["physical"].push(parseInt(physical_score));
        weights[setup]["temporal"].push(parseInt(temporal_score));
        weights[setup]["effort"].push(parseInt(effort_score));
        weights[setup]["frustration"].push(parseInt(frustration_score));
    }

    // console.log(weights)

    for (let participantId in userData) {
        const setup = userData[participantId]["experiment_setup"];
        const tlx_score = userData[participantId][tlxtype]["weighted_score"];
        // tlxtype = "tlxtlx";
        // if (setup === "short") continue;
        tlx_scores[setup].push(parseInt(tlx_score));
    }

    console.log(Object.values(data["long"]));
    let tmp = [];
    for (let i in [0, 1, 2, 3, 4, 5, 6]) {
        let s = 0;
        for (let arr of Object.values(data["long"])) {
            s += arr[i]/6
        }
        tmp.push(s);
    }
    // print the average of values in tmp
    tmp = tmp.reduce((sum, val) => sum + val, 0) / tmp.length;
    tmp = tmp.toFixed(2);
    console.log("Average of long setup:", tmp);
    console.log("tlx_scores", tlx_scores)

    // for every setup, for every category, compute median and quartiles
    for (let setup in data) {
        for (let category in data[setup]) {
            data[setup][category].sort((a, b) => a - b);
            const n = data[setup][category].length;
            const median = n % 2 === 0 ? (data[setup][category][n / 2 - 1] + data[setup][category][n / 2]) / 2 : data[setup][category][Math.floor(n / 2)];
            const q1 = data[setup][category][Math.floor(n / 4)];
            const q3 = data[setup][category][Math.floor(3 * n / 4)];
            const min = data[setup][category][0];
            const max = data[setup][category][n - 1];

            data[setup][category] = {
                median: median,
                q1: q1,
                q3: q3,
                min: min,
                max: max,
            };
        }
    }

    console.log(data);

    let category_order = ["mental", "physical", "temporal", "performance", "effort", "frustration"];
    for (let setup in data){
        // start constructing a latex command in a string
        let latexString = "\\nasaChartHorizontal{\n"
        // console.log("setup:", setup);

        // compute average tlx score for this setup
        let avgTlxScore = 0;
        if (tlx_scores[setup].length > 0) {
            avgTlxScore = tlx_scores[setup].reduce((sum, val) => sum + val, 0) / tlx_scores[setup].length;
            avgTlxScore = (avgTlxScore).toFixed(2);
        }

        for (let category of category_order) {
            let categoryabbreviation = ""
            if (category === "performance") categoryabbreviation = "Performance";
            else if (category === "mental") categoryabbreviation = "Mental Demand";
            else if (category === "physical") categoryabbreviation = "Physical Demand";
            else if (category === "temporal") categoryabbreviation = "Temporal Demand";
            else if (category === "effort") categoryabbreviation = "Effort";
            else if (category === "frustration") categoryabbreviation = "Frustration";

            // Calculate average weight for this setup and category
            let avgWeight = 0;
            if ((setup !== "short" && tlxtype == "tlx") && weights[setup][category].length > 0) {
                avgWeight = weights[setup][category].reduce((sum, val) => sum + val, 0) / weights[setup][category].length;
                avgWeight = (avgWeight/2.5).toFixed(2)
            }

            latexString += "\\nasaWhiskerBarHorizontal{" + categoryabbreviation + "}{" 
                + data[setup][category].median + "}{" 
                + bar_fill_styles[category_order.indexOf(category)] + "}{" 
                + avgWeight + "}{" 
                + (data[setup][category].median - data[setup][category].q1) + "}{"
                + (data[setup][category].q3 - data[setup][category].median) + "}\n"
                
            
        }
        latexString += "}[" + avgTlxScore + "]\n";
        console.log(latexString);
    }
    
}