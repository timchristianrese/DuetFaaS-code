terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.32"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 2.0"
    }
  }
}

data "aws_region" "current" {}

data "aws_caller_identity" "this" {}

data "aws_ecr_authorization_token" "token" {}

locals {
  source_path   = "../../.faas-duet"
  path_include  = ["**"]
  path_exclude  = ["**/node_modules/**", "**/dist/**"]
  files_include = setunion([for f in local.path_include : fileset(local.source_path, f)]...)
  files_exclude = setunion([for f in local.path_exclude : fileset(local.source_path, f)]...)
  files         = sort(setsubtract(local.files_include, local.files_exclude))

  dir_sha = sha1(join("", [for f in local.files : filesha1("${local.source_path}/${f}")]))
}

provider "aws" {
  region = "eu-west-1"
}

provider "docker" {
  registry_auth {
    address  = format("%v.dkr.ecr.%v.amazonaws.com", data.aws_caller_identity.this.account_id, data.aws_region.current.name)
    username = data.aws_ecr_authorization_token.token.user_name
    password = data.aws_ecr_authorization_token.token.password
  }
}

module "lambda_function_with_docker_build" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${random_pet.this.id}-duet-benchmark"
  description   = "A simple duet benchmark"

  create_package = false

  # publish = true

  // Give it a publicly accessible URL
  create_lambda_function_url = true
  memory_size                = 1024

  # reserved_concurrent_executions = 2


  ##################
  # Container Image
  ##################
  package_type  = "Image"
  architectures = ["x86_64"] # ["arm64"]

  image_uri = module.docker_build.image_uri
}

module "docker_build" {
  source = "terraform-aws-modules/lambda/aws//modules/docker-build"

  create_ecr_repo = true
  ecr_repo        = random_pet.this.id
  ecr_repo_lifecycle_policy = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Keep only the last 2 images",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 2
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })

  use_image_tag = false # If false, sha of the image will be used

  # use_image_tag = true
  # image_tag   = "2.0"

  source_path = local.source_path
  platform    = "linux/amd64"
  build_args  = {}

  triggers = {
    dir_sha = local.dir_sha
  }
}

resource "random_pet" "this" {
  length = 2
}
