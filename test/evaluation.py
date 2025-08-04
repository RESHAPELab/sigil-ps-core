import sys
import os
from sys import argv
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Retrieve the API key from the environment variables
api_key = os.getenv('OPENAI_API_KEY')

# Set the API key in os.environ
if api_key:
    #deepeval needs this to detect the api_key
    os.environ['OPENAI_API_KEY'] = api_key
else:
    raise ValueError("OPENAI_API_KEY not found in the environment variables.")

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json

# from dataset_util import get_actual_outputs_from_file
from dataset_util import json_to_metric_from_file

'''
Output json file schema

{
    "data": [
        {
            "question": "",
            "code": "",
            "answer": "",    
            "metrics": [
                {
                    "metric": Some metric,
                    "metric_score": 5
                },
                {
                    "metric": "Some Metric",
                    "metric_score": 5
                }
            ]
        },
    ],
    "overall_metric_score": {
        "Tutor Similarity": Some score,
        "Example Metric": Some score
    }
}
'''


def main():
    if len(argv) != 3:
        print("Usage: evaluate test.json output.json")
        return 1

    #load file that contains the data and metric file path
    filename = argv[1]
    file = open(filename)
    data_and_metric_json = json.loads(file.read())
    file.close()

    #load data from file
    data_filename = data_and_metric_json["datasets"]
    file = open(data_filename)
    json_data = json.loads(file.read())
    file.close()
    
    #load metric from file
    metric_filenames = data_and_metric_json["metrics"]
    # metric = json_to_metric_from_file(metric_filenames)
    metrics = [json_to_metric_from_file(metric_file) for metric_file in metric_filenames]
    output_dict = {
        "data": [],
        "overall_metric_score": 0
    }

    metric_totals = {metric["name"]: 0 for metric in metrics}

    # loop through dataset
    for data in json_data["data"]:

        # Create temporary dictionary with all info to store in json data array
        temp_dict = {
                "question": data["input"],
                "code": data["code"],
                "answer": data["actual_output"],
                "metrics" : []
            }
        
        # Loop through each metric and evaluate the data
        for metric in metrics:
            print(f"metric: {metric}")
            # Get the metric score for the current data
            score = metric["evaluate"](data)
            metric_totals[metric["name"]] += score
            output_dict["overall_metric_score"] += score

            temp_dict["metrics"].append(
                    {
                        "metric": metric["name"],
                        "metric_score": score
                    }
                )

        # Add the metric score to the output dictionary
        output_dict["data"].append(temp_dict)
            

    # Log overall score of the evaluation of metrics
    output_dict["overall_metric_score"] = {metric["name"]: metric_totals[metric["name"]] / len(json_data['data']) for metric in metrics}

    
    #loads second file and writes json log object
    filename = argv[2]
    file = open(filename, "w", encoding="utf-8")
    json.dump(output_dict, file, indent = 4)
    
    file.close()

if __name__ == "__main__":
    main()