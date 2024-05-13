output "docker_image_files_to_hash" {
  description = "List of files used to hash the docker image tag"
  value       = local.files
}


output "lambda_function_invoke_url" {
  description = "The URL where the function is available"
  value       = module.lambda_function_with_docker_build.lambda_function_url
}

output "caller_user" {
  value = data.aws_caller_identity.this.user_id
}

output "caller_account" {
  value = data.aws_caller_identity.this.account_id
}


