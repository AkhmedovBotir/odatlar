param(
    [string]$FirstName,
    [string]$LastName,
    [string]$Phone,
    [string]$Username,
    [string]$Password
)

$args = @()

if ($FirstName)  { $args += "-first_name=$FirstName" }
if ($LastName)   { $args += "-last_name=$LastName" }
if ($Phone)      { $args += "-phone=$Phone" }
if ($Username)   { $args += "-username=$Username" }
if ($Password)   { $args += "-password=$Password" }

go run ./cmd/create-admin @args
