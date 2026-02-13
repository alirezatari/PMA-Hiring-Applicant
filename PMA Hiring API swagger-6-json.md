{
  "openapi": "3.0.1",
  "info": {
    "title": "PMA Hiring API",
    "version": "v1"
  },
  "servers": [
    {
      "url": "/PMAHiringService"
    }
  ],
  "paths": {
    "/api/Applicants": {
      "post": {
        "tags": [
          "Applicants"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "Applicants"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Applicants/{applicantId}": {
      "get": {
        "tags": [
          "Applicants"
        ],
        "parameters": [
          {
            "name": "applicantId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "put": {
        "tags": [
          "Applicants"
        ],
        "parameters": [
          {
            "name": "applicantId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateApplicantCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateApplicantCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateApplicantCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateApplicantCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "delete": {
        "tags": [
          "Applicants"
        ],
        "parameters": [
          {
            "name": "applicantId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Applicants/create": {
      "post": {
        "tags": [
          "Applicants"
        ],
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "required": [
                  "FirstName",
                  "ImageFile",
                  "LastName",
                  "ResumeFile"
                ],
                "type": "object",
                "properties": {
                  "FirstName": {
                    "type": "string"
                  },
                  "LastName": {
                    "type": "string"
                  },
                  "Email": {
                    "type": "string",
                    "format": "email"
                  },
                  "NationalCode": {
                    "type": "string"
                  },
                  "Mobile": {
                    "type": "string"
                  },
                  "Description": {
                    "type": "string"
                  },
                  "ProvinceId": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "CityId": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "Gender": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "BirthDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "WorkExperienceYears": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "MaritalStatus": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "MilitaryStatus": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "EducationField": {
                    "type": "string"
                  },
                  "LastJobTitle": {
                    "type": "string"
                  },
                  "LinkedInLink": {
                    "type": "string"
                  },
                  "SocialLink": {
                    "type": "string"
                  },
                  "JobGroupId": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "ResumeFile": {
                    "type": "string",
                    "format": "binary"
                  },
                  "ImageFile": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              },
              "encoding": {
                "FirstName": {
                  "style": "form"
                },
                "LastName": {
                  "style": "form"
                },
                "Email": {
                  "style": "form"
                },
                "NationalCode": {
                  "style": "form"
                },
                "Mobile": {
                  "style": "form"
                },
                "Description": {
                  "style": "form"
                },
                "ProvinceId": {
                  "style": "form"
                },
                "CityId": {
                  "style": "form"
                },
                "Gender": {
                  "style": "form"
                },
                "BirthDate": {
                  "style": "form"
                },
                "WorkExperienceYears": {
                  "style": "form"
                },
                "MaritalStatus": {
                  "style": "form"
                },
                "MilitaryStatus": {
                  "style": "form"
                },
                "EducationField": {
                  "style": "form"
                },
                "LastJobTitle": {
                  "style": "form"
                },
                "LinkedInLink": {
                  "style": "form"
                },
                "SocialLink": {
                  "style": "form"
                },
                "JobGroupId": {
                  "style": "form"
                },
                "ResumeFile": {
                  "style": "form"
                },
                "ImageFile": {
                  "style": "form"
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ApplicantStatuses": {
      "post": {
        "tags": [
          "ApplicantStatuses"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "ApplicantStatuses"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ApplicantStatuses/{applicantStatusId}": {
      "get": {
        "tags": [
          "ApplicantStatuses"
        ],
        "parameters": [
          {
            "name": "applicantStatusId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ApplicantStatusHistories": {
      "post": {
        "tags": [
          "ApplicantStatusHistories"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusHistoriesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusHistoriesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusHistoriesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetApplicantStatusHistoriesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ApplicantStatusHistories/{statusHistoryId}": {
      "get": {
        "tags": [
          "ApplicantStatusHistories"
        ],
        "parameters": [
          {
            "name": "statusHistoryId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ApplicantStatusHistories/create": {
      "post": {
        "tags": [
          "ApplicantStatusHistories"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateApplicantStatusHistoryCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateApplicantStatusHistoryCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateApplicantStatusHistoryCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateApplicantStatusHistoryCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Authenticate/authenticate": {
      "post": {
        "tags": [
          "Authenticate"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/AuthenticateRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AuthenticateRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/AuthenticateRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/AuthenticateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Captcha": {
      "get": {
        "tags": [
          "Captcha"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Captcha/image": {
      "get": {
        "tags": [
          "Captcha"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Cities": {
      "post": {
        "tags": [
          "Cities"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetCitiesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetCitiesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetCitiesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetCitiesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "Cities"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/EducationLevels": {
      "post": {
        "tags": [
          "EducationLevels"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetEducationLevelsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetEducationLevelsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetEducationLevelsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetEducationLevelsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "EducationLevels"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/EducationLevels/{educationLevelId}": {
      "get": {
        "tags": [
          "EducationLevels"
        ],
        "parameters": [
          {
            "name": "educationLevelId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/EmploymentTypes": {
      "post": {
        "tags": [
          "EmploymentTypes"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetEmploymentTypesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetEmploymentTypesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetEmploymentTypesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetEmploymentTypesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "EmploymentTypes"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/EmploymentTypes/{employmentTypeId}": {
      "get": {
        "tags": [
          "EmploymentTypes"
        ],
        "parameters": [
          {
            "name": "employmentTypeId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/ExistHost": {
      "get": {
        "tags": [
          "ExistHost"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Files/download": {
      "get": {
        "tags": [
          "Files"
        ],
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Files/applicant/{applicantId}/link": {
      "get": {
        "tags": [
          "Files"
        ],
        "parameters": [
          {
            "name": "applicantId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "minutes",
            "in": "query",
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobApplications": {
      "post": {
        "tags": [
          "JobApplications"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobApplicationsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobApplicationsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobApplicationsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobApplicationsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "JobApplications"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobApplications/{jobApplicationId}": {
      "get": {
        "tags": [
          "JobApplications"
        ],
        "parameters": [
          {
            "name": "jobApplicationId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "put": {
        "tags": [
          "JobApplications"
        ],
        "parameters": [
          {
            "name": "jobApplicationId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobApplicationCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobApplicationCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobApplicationCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobApplicationCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "delete": {
        "tags": [
          "JobApplications"
        ],
        "parameters": [
          {
            "name": "jobApplicationId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobApplications/create": {
      "post": {
        "tags": [
          "JobApplications"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobApplicationCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobApplicationCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobApplicationCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobApplicationCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobGroups": {
      "post": {
        "tags": [
          "JobGroups"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "JobGroups"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobGroups/counts": {
      "post": {
        "tags": [
          "JobGroups"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsWithCountsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsWithCountsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsWithCountsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsWithCountsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobGroups/statuscounts": {
      "post": {
        "tags": [
          "JobGroups"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsStatusCountsRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsStatusCountsRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsStatusCountsRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetJobGroupsStatusCountsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobGroups/{jobGroupId}": {
      "get": {
        "tags": [
          "JobGroups"
        ],
        "parameters": [
          {
            "name": "jobGroupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "put": {
        "tags": [
          "JobGroups"
        ],
        "parameters": [
          {
            "name": "jobGroupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobGroupCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobGroupCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobGroupCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateJobGroupCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "delete": {
        "tags": [
          "JobGroups"
        ],
        "parameters": [
          {
            "name": "jobGroupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/JobGroups/create": {
      "post": {
        "tags": [
          "JobGroups"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobGroupCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobGroupCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobGroupCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/CreateJobGroupCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Provinces": {
      "post": {
        "tags": [
          "Provinces"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetProvincesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetProvincesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetProvincesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetProvincesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "Provinces"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Provinces/{provinceId}": {
      "get": {
        "tags": [
          "Provinces"
        ],
        "parameters": [
          {
            "name": "provinceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Roles": {
      "post": {
        "tags": [
          "Roles"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetRolesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetRolesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetRolesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetRolesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "Roles"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Roles/{roleId}": {
      "get": {
        "tags": [
          "Roles"
        ],
        "parameters": [
          {
            "name": "roleId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/UserRoles": {
      "post": {
        "tags": [
          "UserRoles"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/GetUserRolesRequest"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetUserRolesRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/GetUserRolesRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/GetUserRolesRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "get": {
        "tags": [
          "UserRoles"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/UserRoles/{userRoleId}": {
      "get": {
        "tags": [
          "UserRoles"
        ],
        "parameters": [
          {
            "name": "userRoleId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "delete": {
        "tags": [
          "UserRoles"
        ],
        "parameters": [
          {
            "name": "userRoleId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/UserRoles/add": {
      "post": {
        "tags": [
          "UserRoles"
        ],
        "requestBody": {
          "content": {
            "application/json-patch+json": {
              "schema": {
                "$ref": "#/components/schemas/AddUserRoleCommand"
              }
            },
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AddUserRoleCommand"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/AddUserRoleCommand"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/AddUserRoleCommand"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "AddUserRoleCommand": {
        "type": "object",
        "properties": {
          "userId": {
            "type": "integer",
            "format": "int32"
          },
          "roleId": {
            "type": "integer",
            "format": "int32"
          }
        },
        "additionalProperties": false
      },
      "AuthenticateRequest": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "nullable": true
          },
          "password": {
            "type": "string",
            "nullable": true
          },
          "secret": {
            "type": "string",
            "nullable": true
          },
          "captchaId": {
            "type": "string",
            "nullable": true
          },
          "captchaValue": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "CreateApplicantStatusHistoryCommand": {
        "type": "object",
        "properties": {
          "jobApplicationId": {
            "type": "integer",
            "format": "int32"
          },
          "applicantStatusId": {
            "type": "integer",
            "format": "int32"
          },
          "changedByUserId": {
            "type": "integer",
            "format": "int32"
          },
          "comment": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "CreateJobApplicationCommand": {
        "type": "object",
        "properties": {
          "applicantId": {
            "type": "integer",
            "format": "int32"
          },
          "jobGroupId": {
            "type": "integer",
            "format": "int32"
          },
          "applicationStatusId": {
            "type": "integer",
            "format": "int32"
          },
          "appliedDate": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "CreateJobGroupCommand": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "jobRequirements": {
            "type": "string",
            "nullable": true
          },
          "benefits": {
            "type": "string",
            "nullable": true
          },
          "minWorkExperience": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "minEducationLevelId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "employmentTypeId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "cityID": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "isRemoteAllowed": {
            "type": "boolean",
            "nullable": true
          },
          "creatorUserId": {
            "type": "integer",
            "format": "int32"
          },
          "isActive": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      },
      "GetApplicantStatusHistoriesRequest": {
        "type": "object",
        "properties": {
          "jobApplicationId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "applicantStatusId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetApplicantStatusesRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetApplicantsRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          },
          "applicantStatusId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetCitiesRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetEducationLevelsRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetEmploymentTypesRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetJobApplicationsRequest": {
        "type": "object",
        "properties": {
          "applicantId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "jobGroupId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "applicationStatusId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetJobGroupsRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          },
          "isActive": {
            "type": "boolean",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetJobGroupsStatusCountsRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          },
          "isActive": {
            "type": "boolean",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetJobGroupsWithCountsRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          },
          "isActive": {
            "type": "boolean",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetProvincesRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetRolesRequest": {
        "type": "object",
        "properties": {
          "searchKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "GetUserRolesRequest": {
        "type": "object",
        "properties": {
          "userId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "roleId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "UpdateApplicantCommand": {
        "required": [
          "imageFile",
          "resumeFile"
        ],
        "type": "object",
        "properties": {
          "applicantId": {
            "type": "integer",
            "format": "int32"
          },
          "firstName": {
            "type": "string",
            "nullable": true
          },
          "lastName": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          },
          "mobile": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "provinceId": {
            "type": "integer",
            "format": "int32"
          },
          "cityId": {
            "type": "integer",
            "format": "int32"
          },
          "workExperienceYears": {
            "type": "integer",
            "format": "int32"
          },
          "maritalStatus": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "militaryStatus": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "educationField": {
            "type": "string",
            "nullable": true
          },
          "lastJobTitle": {
            "type": "string",
            "nullable": true
          },
          "linkedInLink": {
            "type": "string",
            "nullable": true
          },
          "socialLink": {
            "type": "string",
            "nullable": true
          },
          "resumeFile": {
            "type": "string",
            "format": "binary"
          },
          "imageFile": {
            "type": "string",
            "format": "binary"
          }
        },
        "additionalProperties": false
      },
      "UpdateJobApplicationCommand": {
        "type": "object",
        "properties": {
          "jobApplicationId": {
            "type": "integer",
            "format": "int32"
          },
          "jobGroupId": {
            "type": "integer",
            "format": "int32"
          },
          "applicationStatusId": {
            "type": "integer",
            "format": "int32"
          },
          "appliedDate": {
            "type": "string",
            "format": "date-time"
          }
        },
        "additionalProperties": false
      },
      "UpdateJobGroupCommand": {
        "type": "object",
        "properties": {
          "jobGroupId": {
            "type": "integer",
            "format": "int32"
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "jobRequirements": {
            "type": "string",
            "nullable": true
          },
          "benefits": {
            "type": "string",
            "nullable": true
          },
          "minWorkExperience": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "minEducationLevelId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "employmentTypeId": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "cityID": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "isRemoteAllowed": {
            "type": "boolean",
            "nullable": true
          },
          "updatorUserId": {
            "type": "integer",
            "format": "int32"
          },
          "isActive": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      }
    },
    "securitySchemes": {
      "Bearer": {
        "type": "http",
        "description": "Please enter token",
        "scheme": "Bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [
    {
      "Bearer": [ ]
    }
  ]
}