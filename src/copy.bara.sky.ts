export const copyBaraSky = ({
  sotRepo,
  sotBranch,
  destinationRepo,
  destinationBranch,
  committer,
  originFilesInclude,
  originFilesExclude,
  destinationFilesInclude,
  destinationFilesExclude,
  transformations,
  assignees,
}: {
  sotRepo: string;
  sotBranch: string;
  destinationRepo: string;
  destinationBranch: string;
  committer: string;
  originFilesInclude: string;
  originFilesExclude: string;
  destinationFilesInclude: string;
  destinationFilesExclude: string;
  transformations: string;
  assignees: string;
}): string => `
# Variables
SOT_REPO = "${sotRepo}"
SOT_BRANCH = "${sotBranch}"
DESTINATION_REPO = "${destinationRepo}"
DESTINATION_BRANCH = "${destinationBranch}"
COMMITTER = "${committer}"

ORIGIN_FILES_INCLUDE = [${originFilesInclude}]
ORIGIN_FILES_EXCLUDE = [${originFilesExclude}]
DESTINATION_FILES_INCLUDE = [${destinationFilesInclude}]
DESTINATION_FILES_EXCLUDE = [${destinationFilesExclude}]

TRANSFORMATIONS = [${transformations}
]

# Specific to push flow
ASSIGNEES = ["${assignees}"]

# Push SoT to PR to Destination workflow
core.workflow(
    name = "push",
    origin = git.origin(
        url = SOT_REPO,
        ref = SOT_BRANCH,
    ),
    destination = git.github_pr_destination(
        url = DESTINATION_REPO,
        destination_ref = DESTINATION_BRANCH,
        assignees = ASSIGNEES,
        integrates = [],
    ),
    authoring = authoring.pass_thru(default = COMMITTER),
    origin_files = glob(ORIGIN_FILES_INCLUDE, exclude = ORIGIN_FILES_EXCLUDE),
    destination_files = glob(DESTINATION_FILES_INCLUDE, exclude = DESTINATION_FILES_EXCLUDE),
    transformations = [
        metadata.save_author("ORIGINAL_AUTHOR"),
        metadata.expose_label("COPYBARA_INTEGRATE_REVIEW"),
    ] + TRANSFORMATIONS,
)
`;
