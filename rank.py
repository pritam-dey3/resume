import glob
import os


# get all the .rst files in the posts folder
parent = "posts"
files = glob.glob(f"{parent}/*.rst")

# extract only the file names without the directory
file_names = [os.path.basename(file) for file in files]

# prompt the user to sort the files
while True:
    print("Please sort the following files by their priority separated by commas:")
    print(", ".join(file_names))
    user_input = input()

    # check if all files are provided by the user
    if sorted(file_names) == sorted(user_input.split(",")):
        break
    else:
        print("Please provide all the file names separated by commas.")

sorted_files = [f.strip() for f in user_input.split(",")]

# assign ranks to the files based on their sorted order
ranks = {file: rank for rank, file in enumerate(sorted_files, 1)}

# update the rank metadata in each file
for file, rank in ranks.items():
    with open(f"{parent}/{file}", "r") as f:
        lines = f.readlines()

    # check if the rank metadata is already present
    for i, line in enumerate(lines):
        if line.startswith(".. rank"):
            lines.pop(i)
            break

    # find the end of metadata in the file
    metadata_end = next(
        (i for i, line in enumerate(lines) if line.strip() == ""), len(lines)
    )

    # insert the updated rank metadata at the end of metadata
    lines.insert(metadata_end, f".. rank: {ranks[file]}\n")

    # write the updated content to the file
    with open(file, "w") as f:
        f.writelines(lines)
