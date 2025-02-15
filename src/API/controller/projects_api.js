const mysqlConnection = require("../../db/sqlconn");
const project = require("../../model/createProject");
const permission = require("../../model/addpermissions");
const Role = require("../../model/roles");
const task = require("../../model/createTask");
const user = require("../../model/user");
const technology = require("../../model/technology");
const country = require("../../model/city");
// const city = require("../../model/country");
const holiday = require("../../model/holiday");
const assignInventory = require("../../model/assignInventory");
const inventory = require("../../model/inventoryItem");
const cpuInventory = require("../../model/cpuMasterInventory");
// const state = require("../../model/state");
const session = require("express-session");
const permissionModule = require("../../model/permission_module");
const mongoose = require("mongoose");
const express = require("express");
const ejs = require("ejs");
var network = require("network");
const crypto = require("crypto");
const Holiday = require("../../model/holiday");
const Announcement = require("../../model/Announcement");
const Settings = require("../../model/settings");
// const leaves = require("../../model/leaves");
const timeEntry = require("../../model/timeEntries");
const workingHour = require("../../model/working_hour");
const timeEntryRequest = require("../../model/timeEntryRequest");
const Permission = require("../../model/addpermissions");
const emailtoken = require("../../model/token");
const city = require("../../model/city");
const rolePermissions = require("../../model/rolePermission");
const annumncementStatus = require("../../model/announcementStatus");
const userPermissions = require("../../model/userPermission");
const leaves = require("../../model/leaves");
const leaveHistory = require("../../model/leaveHistory");
const punchController = require("../controller/punchController.js");

const salary = require("../../model/salary");
const salay_particulars = require("../../model/salaryparticulars");
const salarustructure = require("../../model/salarystructure");
const salary_genrated = require("../../model/sal_slip_genrated");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/send_forget_mail");
const sendleaveEmail = require("../../utils/send_leave_mail");
const sendtimeEntryRequestEmail = require("../../utils/sendtimeEntryRequestEmail");
const sendAcceptRejctEmail = require("../../utils/send_acceptedleave_mail");
const sendAcceptRejctTimeEntryRequest = require("../../utils/sendAcceptRejctTimeEntryRequest");
const sendSalarySlip = require("../../utils/salary_slip_mail");
const BSON = require("bson");
const axios = require("axios");
const sendUserEmail = require("../../utils/sendemail");
const Helper = require("../../utils/helper");
const helper = new Helper();
const os = require("os");
const pdf = require("html-pdf");
const fs = require("fs");
const moment = require("moment");
// const { upload } = require("../../helpers/image");
const bcrypt = require("bcryptjs");
const { log, time } = require("console");
const { find } = require("../../model/createProject");
const cron = require("node-cron");
// const { join } = require("path");
const path = require("path");
//logger code 1may
const winston = require("winston");
const activity = require("../../model/log");
const userApi = require("../../project_api/user");
const { permissionModules } = require("./permissionModuleController");
const logFormat = winston.format(async (info) => {
  const { title, level, message, user_id, role, refId } = info;
  const logs = await new activity({
    title,
    user_id,
    message,
    level,
    role,
  });
  if (refId) {
    logs.ref_id = refId;
  }
  // await logs.save();
  // return logs;
  return true;
});

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: logFormat(),
});

const logUserIdentity = async (req, data, ref_id, title) => {
  try {
    const refId = ref_id ? ref_id : "";
    const userData = await user.aggregate([
      { $match: { _id: req.user._id, deleted_at: null } },
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "roleData",
        },
      },
      {
        $project: {
          "roleData.role_name": 1,
          "roleData._id": 1,
          firstname: 1,
          last_name: 1,
          photo: 1,
          company_email: 1,
          mo_number: 1,
          status: 1,
          doj: 1,
          emp_code: 1,
          _id: 1,
        },
      },
    ]);

    if (userData[0]) {
      const userRecord = userData[0];
      const message = `${userRecord.firstname} ${userRecord.last_name} ${data}`;
      const user_id = userRecord._id;
      const role = userRecord.roleData[0]?.role_name;

      logger.info({ message, user_id, refId, role, title });
    } else {
      logger.error("User data not found or empty.");
    }
  } catch (error) {
    console.error(error);
    logger.error("An error occurred while fetching user data.");
    res.status(400).json({ message: error.message });
  }
};

const apicontroller = {};

apicontroller.useradd = async (req, res) => {
  const userData = req.body.role_id;
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Employee")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const emailExist = await user.findOne({
          // personal_email: req.body.personal_email,
          company_email: req.body.company_email,
          deleted_at: "null",
        });
        if (emailExist) {
          res.json("email already exist");
        } else {
          if (!req.files) {
            var addUser = new user({
              role_id: req.body.role_id,
              emp_code: req.body.emp_code,
              reporting_user_id: req.body.reporting_user_id,
              firstname: req.body.firstname,
              user_name: req.body.user_name,
              middle_name: req.body.middle_name,
              password: req.body.password,
              last_name: req.body.last_name,
              gender: req.body.gender,
              dob: req.body.dob,
              doj: req.body.doj,
              personal_email: req.body.personal_email,
              company_email: req.body.company_email,
              mo_number: req.body.mo_number,
              pan_number: req.body.pan_number,
              aadhar_number: req.body.aadhar_number,
              add_1: req.body.add_1,
              add_2: req.body.add_2,
              city: req.body.city,
              state: req.body.state,
              country: req.body.country,
              pincode: req.body.pincode,
              photo: "",
              bank_account_no: req.body.bank_account_no,
              bank_name: req.body.bank_name,
              ifsc_code: req.body.ifsc_code,
            });
          } else {
            let file = req.files.photo;
            file.mv("public/images/" + file.name);
            var addUser = new user({
              role_id: req.body.role_id,
              emp_code: req.body.emp_code,
              reporting_user_id: req.body.reporting_user_id,
              firstname: req.body.firstname,
              user_name: req.body.user_name,
              middle_name: req.body.middle_name,
              password: req.body.password,
              last_name: req.body.last_name,
              gender: req.body.gender,
              dob: req.body.dob,
              doj: req.body.doj,
              personal_email: req.body.personal_email,
              company_email: req.body.company_email,
              mo_number: req.body.mo_number,
              pan_number: req.body.pan_number,
              aadhar_number: req.body.aadhar_number,
              add_1: req.body.add_1,
              add_2: req.body.add_2,
              city: req.body.city,
              state: req.body.state,
              country: req.body.country,
              pincode: req.body.pincode,
              photo: file.name,
              bank_account_no: req.body.bank_account_no,
              bank_name: req.body.bank_name,
              ifsc_code: req.body.ifsc_code,
            });
          }
          const email = req.body.company_email;
          const name = req.body.user_name;
          const firstname = req.body.firstname;

          const genrate_token = await addUser.genrateToken();

          const Useradd = await addUser.save();

          //add user leave
          const leavesSettingData = await Settings.find({ key: "leaves" });
          // userData.forEach(async user => {
          const doj = Useradd.doj;
          const dojYear = doj.getFullYear();
          const dojMonth = doj.getMonth() + 1; // Adding 1 because months are zero-based
          let workingMonths;
          let totalLeaves = parseInt(leavesSettingData[0].value);
          let academicYear;
          if (dojMonth >= 4) {
            workingMonths = 12 - (dojMonth - 4); // Corrected subtraction
            academicYear = `${dojYear}-${dojYear + 1}`;
          } else {
            workingMonths = 4 - dojMonth;
            academicYear = `${dojYear - 1}-${dojYear}`;
          }
          totalLeaves = Math.floor(totalLeaves / 12) * workingMonths;
          const payload = new leaveHistory({
            user_id: Useradd._id,
            year: academicYear,
            total_leaves: totalLeaves,
            taken_leaves: 0,
            remaining_leaves: totalLeaves,
          });
          const userLeavesData = payload.save();
          const id = Useradd._id;
          await sendUserEmail(email, id, name, firstname);
          logUserIdentity(
            req,
            `added ${req.body.firstname} ${req.body.last_name} as a new Employee`
          );

          res.json({
            response: "created done",
            status: true,
          });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.existusername = async (req, res) => {
  try {
    const Existuser = await user.findOne({
      user_name: req.body.user_name,
      deleted_at: "null",
    });
    if (Existuser) {
      res.json({ status: true });
    } else {
      res.status(403).json({ status: false, errors: "Permission denied" });
    }
  } catch (e) {
    res.json("invalid");
  }
};
apicontroller.existpersonal_email = async (req, res) => {
  try {
    const Existuser = await user.findOne({
      company_email: req.body.company_email,
      deleted_at: "null",
    });
    if (Existuser) {
      res.json({ status: true });
    } else {
      res.status(403).json({ status: false, errors: "Permission denied" });
    }
  } catch (e) {
    res.json("invalid");
  }
};
apicontroller.getAddUser = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Add Employee")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const role = await Role.find({ deleted_at: "null" }).select(
          "_id role_name"
        );
        const cities = await city.find().select("city");
        const users = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name emp_code");
        res.json({ role, cities, users });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.change_password = async (req, res) => {
  sess = req.session;
  try {
    const _id = req.params.id;
    const userData = await user.findById(_id);
    res.render("change_password", {
      userData: userData,
      loggeduserdata: req.user,
      users: sess.userData,
      role: sess.role,
      layout: false,
      alert: req.flash("alert"),
      success: req.flash("success"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.save_password = async (req, res) => {
  sess = req.session;
  try {
    const _id = req.params.id;

    const password = req.body.oldpassword;
    const newpwd = req.body.newpassword;
    const cpassword = req.body.cpassword;
    const bcryptpass = await bcrypt.hash(newpwd, 10);
    const newpassword = {
      password: bcryptpass,
      updated_at: Date(),
    };
    const user_id = new BSON.ObjectId(req.params.id);
    const userData = await user.find({ _id: user_id });
    const isMatch = await bcrypt.compare(password, userData[0].password);
    if (!isMatch) {
      res.json({
        changePassStatus: false,
        message: "incorrect current password",
      });
    } else if (!(newpwd == cpassword)) {
      res.json({
        changePassStatus: false,
        message: "confirm password not matched",
      });
    } else {
      const newsave = await user.findByIdAndUpdate(_id, newpassword);
      logUserIdentity(
        req,
        `changed ${newsave.gender === "male" ? "his" : "her"} password`
      );
      res.json({ changePassStatus: true, message: "Your Password is Updated" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

apicontroller.activeuser = async (req, res) => {
  try {
    const _id = req.params.id;
    const userActive = {
      status: "Active",
      updated_at: Date(),
    };
    const updateEmployee = await user.findByIdAndUpdate(_id, userActive);
    res.json("now you are Active Employee");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.checkLoginEmail = async (req, res) => {
  try {
    const company_email = req.body.company_email;
    const users = await user
      .find({ company_email: company_email, deleted_at: "null" })
      .select("company_email");
    if (users.length > 0) {
      res.json({ emailError: "Invalid email" });
    } else {
      res.json({ emailStatus: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.checkLoginPassword = async (req, res) => {
  try {
    const company_email = req.body.company_email;
    const password = req.body.password;
    const userData = await user.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { company_email: company_email } },
      { $addFields: { roleId: { $toObjectId: "$role_id" } } },
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "roleData",
        },
      },
    ]);
    if (userData.length > 0) {
      const isMatch = await bcrypt?.compare(password, userData[0]?.password);
      if (!isMatch) {
        res.json({ passwordError: true });
      } else {
        res.json({ passwordStatus: true });
      }
    } else {
      res.json({ isUserExist: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.employeelogin = async (req, res) => {
  try {
    const company_email = req.body.company_email;
    const password = req.body.password;
    const users = await user.findOne({ company_email });
    if (!users) {
      res.json({ emailError: "Invalid email" });
    } else if (!(users.status == "Active")) {
      res.json({ activeError: "please Active Your Account" });
    } else {
      //conole.log(userData)
      const isMatch = await bcrypt.compare(password, users.password);
      if (isMatch) {
        var token = jwt.sign(
          {
            _id: users._id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "5d",
          }
        );
        //  status);
        await user.findByIdAndUpdate(users._id, { token });

        const userData = await user.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { company_email: company_email } },
          { $addFields: { roleId: { $toObjectId: "$role_id" } } },
          {
            $lookup: {
              from: "roles",
              localField: "roleId",
              foreignField: "_id",
              as: "roleData",
            },
          },
        ]);
        res.json({ userData });
      } else {
        res.json({ passwordError: "Incorrect password" });
      }
    }
  } catch (error) {
    console.log("e", error);
  }
};
apicontroller.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
    }
    res.clearCookie(options.name);
    // res.json("logout succuss");
  });
};
apicontroller.getProject = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Project")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const UserData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        var userName = [];
        UserData.forEach(function (element) {
          userName.push({
            value: element._id,
            label: element.firstname,
          });
        });
        const TechnologyData = await technology.find().select("technology");
        var technologyname = [];
        TechnologyData.forEach(function (element) {
          technologyname.push({
            value: element.technology,
            label: element.technology,
          });
        });
        res.json({ UserData, TechnologyData, technologyname, userName });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.projectslisting = async (req, res) => {
  sess = req.session;

  const user_id = new BSON.ObjectId(req.user._id);

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Projects")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const projectData = await project.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { user_id: user_id } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $project: {
              "userData.firstname": 1,
              "userData.last_name": 1,
              title: 1,
              start_date: 1,
              end_date: 1,
              status: 1,
              technology: 1,
              project_type: 1,
              short_description: 1,
              _id: 1,
            },
          },
        ]);

        const adminProjectData = await project.aggregate([
          { $match: { deleted_at: "null" } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $project: {
              "userData.firstname": 1,
              "userData.last_name": 1,
              title: 1,
              start_date: 1,
              end_date: 1,
              status: 1,
              technology: 1,
              project_type: 1,
              short_description: 1,
              _id: 1,
            },
          },
        ]);
        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        res.json({ projectData, adminProjectData, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.projectHashTask = async (req, res) => {
  sess = req.session;

  const user_id = new BSON.ObjectId(req.user._id);

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Projects")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const projectHashTask = await project.aggregate([
          {
            $match: {
              deleted_at: "null",
            },
          },

          {
            $lookup: {
              from: "tasks",
              localField: "_id",
              foreignField: "project_id",
              as: "taskData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user",
            },
          },
        ]);
        res.json({ projectHashTask });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.projectsadd = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Project")
    .then((rolePerm) => {
      if (rolePerm.status == true) {
        project
          .create({
            title: req.body.title,
            short_description: req.body.short_description,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            status: req.body.status,
            technology: req.body.technology,
            project_type: req.body.project_type,
            user_id: req.body.user_id,
          })
          .then(async (Projects) => {
            const userDetail = await user.find({ _id: req.body.user_id });
            const refId = [];
            // userDetail.map((item)=>{
            //   refId.push(`${item._id}`)
            // })
            userDetail
              .filter((item) => item._id !== req.user._id)
              .map((item) => refId.push(`${item._id}`));

            logUserIdentity(
              req,
              `assigned @USERNAME@ and ${+userDetail.length - 1
              } others in a New project`,
              refId,
              "project"
            );
            res.status(201).json(Projects);
          })
          .catch((error) => {
            res.status(400).send(error);
          });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.projectEdit = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Project")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const ProjectData = await project
          .findById(_id)
          .select(
            "_id title short_description start_date end_date status project_type technology user_id"
          );
        const existuserData = await user
          .find({
            _id: { $in: ProjectData.user_id },
          })
          .select("_id firstname last_name");
        const existTechnologyData = await technology
          .find({
            technology: { $in: ProjectData.technology },
          })
          .select("technology");
        const TechnologyData = await technology.find().select("technology");
        var technologyname = [];
        TechnologyData.forEach(function (element) {
          technologyname.push({
            value: element.technology,
            label: element.technology,
          });
        });
        var existTechnologyname = [];
        existTechnologyData.forEach(function (technologies) {
          existTechnologyname.push({
            value: technologies.technology,
            label: technologies.technology,
          });
        });
        const UserData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        var userName = [];
        UserData.forEach(function (element) {
          userName.push({
            value: element._id,
            label: element.firstname,
          });
        });
        var existUserName = [];
        existuserData.forEach(function (users) {
          existUserName.push({
            value: users._id,
            label: users.firstname,
          });
        });
        res.json({
          ProjectData,
          existuserData,
          technologyname,
          existTechnologyname,
          userName,
          existUserName,
          UserData,
          TechnologyData,
          existTechnologyData,
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.projectUpdate = async (req, res) => {
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Project")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const updateProject = {
          title: req.body.title,
          short_description: req.body.short_description,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          status: req.body.status,
          technology: req.body.technology,
          project_type: req.body.project_type,
          user_id: req.body.user_id,
          updated_at: Date(),
        };
        const updateprojectdata = await project.findByIdAndUpdate(
          _id,
          updateProject
        );
        res.json("Project Updated");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.projectdelete = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete Project")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const projectHasTask = await task.find({
          project_id: _id,
          deleted_at: "null",
        });
        if (projectHasTask.length == 0) {
          const deleteProject = {
            deleted_at: Date(),
          };
          await project.findByIdAndUpdate(_id, deleteProject);
          res.json({ deleteProject });
        } else {
          res.json({
            deleteStatus: false,
            message: "Project Assigned to Task",
          });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.permissionspage = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Add Permission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        res.json({ status: "you can add permission" });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.viewpermissions = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Permissions")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const permissionsData = await permission
          .find({ deleted_at: "null" })
          .select("_id permission_name permission_description");
        res.json({ permissionsData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.searchPermissions = async (req, res) => {
  sess = req.session;
  const user_id = new BSON.ObjectId(req.user._id);

  const searchData = await permission
    .find({
      permission_name: {
        $regex: req.params.searchValue,
        $options: "i",
      },
    })
    .select("_id permission_name permission_description");

  if (searchData.length == []) {
    res.status(403).json({ status: false, errors: "Permission denied" });
  } else {
    res.json({ searchData });
  }
};
apicontroller.searchUserPermissions = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id.toString();
  const role_id = req.user.role_id.toString();
  const searchData = await permission.find({
    permission_name: {
      $regex: req.params.searchValue,
      $options: "i",
    },
  });
  const existUserPermission = await userPermissions.findOne({
    user_id: user_id,
  });
  const existRolePermission = await rolePermissions.findOne({
    role_id: role_id,
  });

  const allPerm = existUserPermission.permission_id.concat(
    existRolePermission.permission_id
  );
  var existPermissions = [...new Set(allPerm)];
  // const permissions = await Permission.find({_id:existPermission.permission_id}).select("permission_name")
  if (searchData.length == []) {
    res.status(403).json({ status: false, errors: "Permission denied" });
  } else {
    res.json({ searchData, existPermissions });
  }
};
apicontroller.searchRolePermissions = async (req, res) => {
  sess = req.session;
  const role_id = req.user.role_id.toString();

  const searchData = await permission.find({
    permission_name: {
      $regex: req.params.searchValue,
      $options: "i",
    },
  });
  const existPermission = await rolePermissions.findOne({ role_id: role_id });
  if (searchData.length == []) {
    res.status(403).json({ status: false, errors: "Permission denied" });
  } else {
    res.json({ searchData, existPermission });
  }
};
apicontroller.searchProject = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id.toString();
  const searchValue = req.params.searchValue;
  if (req.user.roleName == "Admin") {
    const searchData = await project.aggregate([
      {
        $match: {
          deleted_at: "null",
        },
        $match: {
          title: {
            $regex: searchValue,
            $options: "i",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);
    if (searchData.length > 0 && searchData !== "undefined") {
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    } else {
      const searchData = await project.aggregate([
        {
          $match: {
            deleted_at: "null",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "technologies",
            localField: "technology",
            foreignField: "technology",
            as: "technologyData",
          },
        },
        {
          $match: {
            $or: [
              {
                "technologyData.technology": {
                  $regex: searchValue,
                  $options: "i",
                },
              },
              { "userData.firstname": { $regex: searchValue, $options: "i" } },
            ],
          },
        },
      ]);
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    }
  } else {
    const user_id = req.user._id;
    // var user_id = new BSON.ObjectId(req.user._id);
    var searchData = await project.aggregate([
      {
        $match: {
          title: {
            $regex: searchValue,
            $options: "i",
          },
          deleted_at: "null",
          user_id: user_id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);
    if (searchData.length > 0 && searchData !== "undefined") {
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    } else {
      var searchData = await project.aggregate([
        {
          $match: {
            deleted_at: "null",
            user_id: user_id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "technologies",
            localField: "technology",
            foreignField: "technology",
            as: "technologyData",
          },
        },
        {
          $match: {
            $or: [
              {
                "technologyData.technology": {
                  $regex: searchValue,
                  $options: "i",
                },
              },
              { "userData.firstname": { $regex: searchValue, $options: "i" } },
            ],
          },
        },
      ]);
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    }
  }
};

////TimeentryByProject

apicontroller.getTimeEntryDataByProject = async (req, res) => {
  try {
    const projectId = new BSON.ObjectId(req.query.project_id);
    const _month = req.query.month;
    const _year = req.query.year;
    const userMatch = req.query.user_id
      ? [{ $match: { user_id: new BSON.ObjectId(req.query.user_id) } }]
      : [];
    const projectMatch = req.query.project_id
      ? [{ $match: { project_id: new BSON.ObjectId(req.query.project_id) } }]
      : [];

    const projectTimeEntryData = await timeEntry.aggregate([
      { $match: { deleted_at: "null" } },
      ...projectMatch,
      ...userMatch,
      {
        $match: {
          $expr: {
            $and: [
              {
                $cond: {
                  if: { $ne: [_month, ""] }, // Check if _month is not empty
                  then: {
                    $eq: [{ $month: "$date" }, parseInt(_month)],
                  },
                  else: true, // If _month is empty, skip this condition
                },
              },
              {
                $cond: {
                  if: { $ne: [_year, ""] }, // Check if _year is not empty
                  then: {
                    $eq: [{ $year: "$date" }, parseInt(_year)],
                  },
                  else: true, // If _year is empty, skip this condition
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: "$project",
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "task",
        },
      },
      {
        $unwind: "$task",
      },
      {
        $addFields: {
          hoursInt: { $toDouble: "$hours" },
        },
      },
      {
        $group: {
          _id: {
            user_id: "$user._id",
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$date",
              },
            },
          },
          totalHoursUser: { $sum: "$hoursInt" },
          totalHoursMonth: { $sum: "$hoursInt" },
          firstName: { $first: "$user.firstname" },
          tasks: {
            $push: {
              taskName: "$task.title",
              taskHour: "$hoursInt",
              date: "$date",
            },
          },

          // projectTitle: { $first: "$project.title" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          totalHoursMonth: { $sum: "$totalHoursMonth" },
          users: {
            $push: {
              user_id: "$_id.user_id",
              firstname: "$firstName",
              totalHoursUser: "$totalHoursUser",
              tasks: "$tasks",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalHoursMonth: 1,
          users: 1,
          project: "$project.title",
        },
      },
      {
        $sort: {
          month: -1,
        },
      },
    ]);
    const projectEstimatedData = await task.aggregate([
      { $match: { deleted_at: "null" } },
      ...projectMatch,
      ...userMatch,
      {
        $match: {
          $expr: {
            $and: [
              {
                $cond: {
                  if: { $ne: [_month, ""] }, // Check if _month is not empty
                  then: {
                    $eq: [{ $month: "$created_at" }, parseInt(_month)],
                  },
                  else: true, // If _month is empty, skip this condition
                },
              },
              {
                $cond: {
                  if: { $ne: [_year, ""] }, // Check if _year is not empty
                  then: {
                    $eq: [{ $year: "$created_at" }, parseInt(_year)],
                  },
                  else: true, // If _year is empty, skip this condition
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: "$project",
      },
      {
        $addFields: {
          hoursInt: { $toDouble: "$task_estimation" },
        },
      },
      {
        $group: {
          _id: {
            user_id: "$user._id",
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$created_at",
              },
            },
          },
          totalTaskEstimationHoursUser: { $sum: "$hoursInt" },
          totalTaskEstimationHoursMonth: { $sum: "$hoursInt" },
          firstName: { $first: "$user.firstname" },
          tasks: {
            $push: {
              taskName: "$title",
              taskEstimationHour: "$hoursInt",
              date: "$created_at",
            },
          },
          // projectTitle: { $first: "$project.title" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          totalTaskEstimationHoursMonth: {
            $sum: "$totalTaskEstimationHoursMonth",
          },
          users: {
            $push: {
              user_id: "$_id.user_id",
              firstname: "$firstName",
              totalTaskEstimationHoursUser: "$totalTaskEstimationHoursUser",
              tasks: "$tasks",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalTaskEstimationHoursMonth: 1,
          users: 1,
          project: "$project.title",
        },
      },
      {
        $sort: {
          month: -1,
        },
      },
    ]);
    console.log("projectEstimatedData", projectEstimatedData);
    const mergeData = (timeEntryData, estimatedData) => {
      const mergedData = [];

      const estimatedDataMap = new Map(
        estimatedData.map((data) => [data.month, data])
      );

      timeEntryData.forEach((timeEntry) => {
        const correspondingEstimatedData =
          estimatedDataMap.get(timeEntry.month) || null;

        console.log("correspondingEstimatedData", correspondingEstimatedData);

        const mergedEntry = {
          month: timeEntry.month,
          totalHoursMonth: timeEntry.totalHoursMonth,
          totalTaskEstimationHoursMonth: correspondingEstimatedData
            ? correspondingEstimatedData.totalTaskEstimationHoursMonth
            : 0,
          users: timeEntry.users.map((timeEntryUser) => {
            const estimatedUser = correspondingEstimatedData
              ? correspondingEstimatedData.users.find(
                (estimatedUser) =>
                  estimatedUser.user_id.toString() ===
                  timeEntryUser.user_id.toString()
              )
              : null;
            console.log("estimatedUser", estimatedUser);

            return {
              user_id: timeEntryUser.user_id,
              tasks: timeEntryUser.tasks,
              firstname: timeEntryUser.firstname,
              totalHoursUser: timeEntryUser.totalHoursUser,
              estimationTasks: estimatedUser?.tasks,
              totalTaskEstimationHoursUser: estimatedUser
                ? estimatedUser.totalTaskEstimationHoursUser
                : 0,
            };
          }),
        };

        mergedData.push(mergedEntry);
      });

      estimatedData.forEach((estimatedEntry) => {
        console.log("estimatedEntry", estimatedEntry);
        const existingEntry = mergedData.find(
          (mergedEntry) => mergedEntry.month === estimatedEntry.month
        );

        if (!existingEntry) {
          const emptyEntry = {
            month: estimatedEntry.month,
            totalHoursMonth: 0,
            totalTaskEstimationHoursMonth:
              estimatedEntry.totalTaskEstimationHoursMonth,
            users: estimatedEntry.users.map(
              (user) => console.log("user", user),
              {
                user_id: user.user_id,
                firstname: user.firstname,
                totalHoursUser: 0,
                estimationTasks: user.tasks,
                totalTaskEstimationHoursUser: user.totalTaskEstimationHoursUser,
              }
            ),
          };

          mergedData.push(emptyEntry);
        } else {
          // Add users from estimatedEntry if they don't exist in the existingEntry
          estimatedEntry.users.forEach((user) => {
            console.log("user", user);
            const existingUser = existingEntry.users.find(
              (existingUser) =>
                existingUser.user_id.toString() === user.user_id.toString()
            );

            if (!existingUser) {
              existingEntry.users.push({
                user_id: user.user_id,
                firstname: user.firstname,
                totalHoursUser: 0,
                estimationTasks: user.tasks,
                totalTaskEstimationHoursUser: user.totalTaskEstimationHoursUser,
              });
            }
          });
        }
      });

      return mergedData;
    };
    const projectHoursData = mergeData(
      projectTimeEntryData,
      projectEstimatedData
    );
    const allProjectData = await project
      .find({ deleted_at: "null" })
      .select("title")
      .collation({ locale: "en", strength: 2 })
      .sort({ title: 1 });
    const projectData = await project
      .findOne({ deleted_at: "null", _id: projectId })
      .select("title user_id");
    const userData = await user
      .find({ deleted_at: "null", _id: { $in: projectData?.user_id } })
      .select("firstname last_name")
      .collation({ locale: "en", strength: 2 })
      .sort({ firstname: 1 });

    res.json({
      allProjectData,
      projectData,
      userData,
      projectHoursData,
      projectEstimatedData,
    });
  } catch (e) {
    console.log(e, "ErrorCOnsole");
    res.status(400).send(e);
  }
};

apicontroller.searchTask = async (req, res) => {
  sess = req.session;
  const searchValue = req.params.searchValue;
  const user_id = new BSON.ObjectId(req.user._id);
  if (req.user.roleName == "Admin") {
    const searchData = await task.aggregate([
      {
        $match: {
          deleted_at: "null",

          title: {
            $regex: searchValue,
            $options: "i",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData",
        },
      },
      {
        $lookup: {
          from: "timeentries",
          localField: "_id",
          foreignField: "task_id",
          as: "timeEntryData",
        },
      },
      {
        $project: {
          "projectData.title": 1,
          "userData.firstname": 1,
          "userData._id": 1,
          "userData.last_name": 1,
          title: 1,
          task_status: 1,
          task_type: 1,
          short_description: 1,
          task_estimation: 1,
          _id: 1,
          totalHours: {
            $reduce: {
              input: {
                $map: {
                  input: "$timeEntryData",
                  as: "hour",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$$hour.hours", ""] },
                          { $gte: [{ $toDouble: "$$hour.hours" }, 0] },
                        ],
                      },
                      then: { $toDouble: "$$hour.hours" },
                      else: 0,
                    },
                  },
                },
              },
              initialValue: 0,
              in: { $add: ["$$value", "$$this"] },
            },
          },
          estimatedHours: { $toDouble: "$task_estimation" },
        },
      },
      {
        $addFields: {
          productivityFactor: {
            $cond: {
              if: {
                $gte: [
                  {
                    $round: [
                      {
                        $divide: ["$totalHours", "$estimatedHours"],
                      },
                      2,
                    ],
                  },
                  100,
                ],
              },
              then: 100,
              else: {
                $round: [
                  {
                    $divide: ["$totalHours", "$estimatedHours"],
                    /* $divide: [
                      { $multiply: ["$estimatedHours", 100] },
                      {
                        $cond: {
                          if: { $eq: ["$totalHours", 0] },
                          then: 1,
                          else: "$totalHours"
                        }
                      }
                    ] */
                  },
                  2,
                ],
              },
            },
          },
        },
      },
    ]);
    if (searchData.length > 0 && searchData !== "undefined") {
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    } else {
      const searchData = await task.aggregate([
        {
          $match: {
            deleted_at: "null",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project_id",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$deleted_at", "null"],
                  },
                },
              },
            ],
            as: "projectData",
          },
        },
        {
          $lookup: {
            from: "timeentries",
            localField: "_id",
            foreignField: "task_id",
            as: "timeEntryData",
          },
        },
        {
          $match: {
            $or: [
              { "userData.firstname": { $regex: searchValue, $options: "i" } },
              { "projectData.title": { $regex: searchValue, $options: "i" } },
            ],
          },
        },
        {
          $project: {
            "projectData.title": 1,
            "userData.firstname": 1,
            "userData._id": 1,
            "userData.last_name": 1,
            title: 1,
            task_status: 1,
            task_type: 1,
            short_description: 1,
            task_estimation: 1,
            _id: 1,
            totalHours: {
              $reduce: {
                input: {
                  $map: {
                    input: "$timeEntryData",
                    as: "hour",
                    in: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$$hour.hours", ""] },
                            { $gte: [{ $toDouble: "$$hour.hours" }, 0] },
                          ],
                        },
                        then: { $toDouble: "$$hour.hours" },
                        else: 0,
                      },
                    },
                  },
                },
                initialValue: 0,
                in: { $add: ["$$value", "$$this"] },
              },
            },
            estimatedHours: { $toDouble: "$task_estimation" },
          },
        },
        {
          $addFields: {
            productivityFactor: {
              $cond: {
                if: {
                  $gte: [
                    {
                      $round: [
                        {
                          $divide: ["$totalHours", "$estimatedHours"],
                          /*  $divide: [
                           { $multiply: ["$estimatedHours", 100] },
                           {
                             $cond: {
                               if: { $eq: ["$totalHours", 0] },
                               then: 1,
                               else: "$totalHours"
                             }
                           }
                         ] */
                        },
                        2,
                      ],
                    },
                    100,
                  ],
                },
                then: 100,
                else: {
                  $round: [
                    {
                      $divide: ["$totalHours", "$estimatedHours"],
                      /*  $divide: [
                         { $multiply: ["$estimatedHours", 100] },
                         {
                           $cond: {
                             if: { $eq: ["$totalHours", 0] },
                             then: 1,
                             else: "$totalHours"
                           }
                         }
                       ] */
                    },
                    2,
                  ],
                },
              },
            },
          },
        },
      ]);
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    }
  } else {
    const searchData = await task.aggregate([
      {
        $match: {
          deleted_at: "null",
          user_id: user_id,
          title: {
            $regex: searchValue,
            $options: "i",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData",
        },
      },
    ]);
    if (searchData.length > 0 && searchData !== "undefined") {
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    } else {
      const searchData = await task.aggregate([
        {
          $match: {
            deleted_at: "null",
            user_id: user_id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project_id",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$deleted_at", "null"],
                  },
                },
              },
            ],
            as: "projectData",
          },
        },
        {
          $match: {
            $or: [
              { "userData.firstname": { $regex: searchValue, $options: "i" } },
              { "projectData.title": { $regex: searchValue, $options: "i" } },
            ],
          },
        },
      ]);
      if (searchData.length == []) {
        res.status(403).json({ status: false, errors: "Permission denied" });
      } else {
        res.json({ searchData });
      }
    }
  }
};

apicontroller.searchLeave = async (req, res) => {
  sess = req.session;
  const searchValue = req.params.searchValue;
  var searchData = await leaves.aggregate([
    {
      $match: {
        deleted_at: "null",
        reason: {
          $regex: searchValue,
          $options: "i",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $project: {
        "userData.firstname": 1,
        "userData._id": 1,
        reason: 1,
        datefrom: 1,
        dateto: 1,
        total_days: 1,
        status: 1,
        is_adhoc: 1,
        half_day: 1,
      },
    },
  ]);

  if (searchData.length > 0 && searchData !== "undefined") {
    if (searchData.length == []) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      res.json({ searchData });
    }
  } else {
    var searchData = await leaves.aggregate([
      {
        $match: {
          deleted_at: "null",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          $or: [
            { "userData.firstname": { $regex: searchValue, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          "userData.firstname": 1,
          "userData._id": 1,
          reason: 1,
          datefrom: 1,
          dateto: 1,
          total_days: 1,
          status: 1,
          is_adhoc: 1,
          half_day: 1,
        },
      },
    ]);
    if (searchData.length == []) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      res.json({ searchData });
    }
  }
};

apicontroller.getUserTakenLeaves = async (req, res) => {
  const user_id = req.query.user_id;
  const leave_id = req.query.leave_id;
  console.log("leave_id", leave_id);
  const endMonth = moment().month() + 1 < 4;
  const currentYear = endMonth
    ? moment().subtract(1, "year").year()
    : moment().year();
  const thisyear = `${currentYear}-${currentYear + 1}`;

  const userleaveHistoryData = await leaveHistory
    .findOne({ year: thisyear, user_id: user_id })
    .populate("user_id", "firstname last_name")
    .select("taken_leaves");

  const LeaveData = await leaves.findById(leave_id).select("paid_status");
  res.json({ userleaveHistoryData, LeaveData });
};

apicontroller.alluserleavesSearch = async (req, res) => {
  console.log(`111`, req.params.searchValue);

  // sess = req.session;
  // const currentYear = new Date().getFullYear();
  // const nextYear = currentYear + 1;
  const searchValue = req.params.searchValue;
  var searchData = await leaveHistory.aggregate([
    {
      $match: {
        deleted_at: "null",
        year: req.params.year,
      },
    },
    {
      $lookup: {
        from: "users", // Assuming the name of the user collection is "users"
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $match: {
        "user.firstname": {
          $regex: searchValue,
          $options: "i",
        },
      },
    },
    {
      $project: {
        "user.firstname": 1,
        "user.last_name": 1,
        total_leaves: "$total_leaves", // Assuming these fields exist in your leaveHistory collection
        taken_leaves: "$taken_leaves",
        remaining_leaves: "$remaining_leaves",
        year: "$year", // Adjust this based on your actual structure
      },
    },
  ]);

  res.json({ searchData });

  // console.log(searchData, `searchData`)
  // res.json({ searchData });

  // var days = [];
  // let days_difference = 0;

  // searchData.forEach(function (u) {
  //   var takenLeaves = 0;
  //   u.leaves.forEach(function (r) {
  //     if (r.status == "APPROVED") {
  //       takenLeaves += parseFloat(r.total_days);
  //     }
  //   });
  //   days.push({ takenLeaves });
  // });

  // let users = searchData;
  // let leaves = days;

  // for (let i = 0; i < users.length; i++) {
  //   Object.assign(users[i], leaves[i]);
  // }
  // if (searchData.length == []) {
  //   res.status(403).json({ status: false ,errors:'Permission denied' });
  // } else {
  //   res.json({ searchData });
  // }
};
apicontroller.searchEmployeeLeave = async (req, res) => {
  sess = req.session;
  const searchValue = req.params.searchValue;
  var searchData = await leaves.aggregate([
    {
      $match: {
        deleted_at: "null",
        reason: {
          $regex: searchValue,
          $options: "i",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userData",
      },
    },
  ]);
  if (searchData.length > 0 && searchData !== "undefined") {
    res.json({ searchData });
  } else {
    var searchData = await leaves.aggregate([
      {
        $match: {
          deleted_at: "null",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      // {
      //   $unwind: "$userData"
      // },
      // {
      //   $unwind: "$projectData"
      // },
      {
        $match: {
          $or: [
            { "userData.firstname": { $regex: searchValue, $options: "i" } },
          ],
        },
      },
    ]);

    if (searchData.length == []) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      res.json({ searchData });
    }
  }
};
apicontroller.searchUser = async (req, res) => {
  sess = req.session;
  const searchData = await user.find({
    deleted_at: "null",
    $or: [
      {
        firstname: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        user_name: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        emp_code: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        company_email: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        mo_number: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      // {
      //   dob: {
      //     $regex: req.params.searchValue,
      //     $options: "i",
      //   },
      // },
      // {
      //   doj: {
      //     $regex: req.params.searchValue,
      //     $options: "i",
      //   },
      // },
      // {
      //   aadhar_number: {
      //     $regex: req.params.searchValue,
      //     $options: "i",
      //   },
      // },
      // {
      //   city: {
      //     $regex: req.params.searchValue,
      //     $options: "i",
      //   },

      // },
      {
        state: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        country: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
      {
        pincode: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
    ],
  });
  if (searchData.length > 0) {
    res.json({ searchData });
  } else {
    res.status(403).json({ status: false, errors: "Permission denied" });
  }
};
apicontroller.searchHoliday = async (req, res) => {
  sess = req.session;

  const searchData = await Holiday.find({
    deleted_at: "null",
    $or: [
      {
        holiday_name: {
          $regex: req.params.searchValue,
          $options: "i",
        },
      },
    ],
  }).select("holiday_date holiday_name");
  if (searchData.length == 0) {
    res.status(403).json({ status: false, errors: "Permission denied" });
  } else {
    res.json({ searchData });
  }
};
apicontroller.searchRole = async (req, res) => {
  sess = req.session;

  var searchData = await Role.find({
    deleted_at: "null",
    role_name: {
      $regex: req.params.searchValue,
      $options: "i",
    },
  });
  if (searchData.length == 0) {
    res.status(403).json({ status: false, errors: "Permission denied" });
  } else {
    res.json({ searchData });
  }
};

apicontroller.addpermissions = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Add Permission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const newpermissions = new permission({
          permission_name: req.body.permission_name,
          permission_description: req.body.permission_description,
        });
        try {
          await newpermissions.save();
          res.status(201).json({ message: "Permission Created Successfully" });
        } catch (error) {
          if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map(
              (err) => err.message
            );
            res.status(400).json({ errors: errorMessages.join(", ") });
          } else {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
          }
        }
        // const permissionsadd = await newpermissions.save();
        // res.json({ permissionsadd });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.editpermissions = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Permission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const permissionData = await permission
          .findById(_id)
          .select("_id permission_name permission_description ");
        res.json({ permissionData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.permissionsUpdate = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const _id = req.params.id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Permission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const permissions = {
          permission_name: req.body.permission_name,
          permission_description: req.body.permission_description,
          updated_at: Date(),
        };
        try {
          await permission.findByIdAndUpdate(_id, permissions, {
            runValidators: true,
            context: "query",
          });
          res.status(201).json({ message: "Permission Updated Successfully" });
        } catch (error) {
          if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map(
              (err) => err.message
            );
            res.status(400).json({ errors: errorMessages.join(", ") });
          } else {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
          }
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(403).send(error);
    });
};
apicontroller.permissionsdelete = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete Permission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const roleHasPermission = await rolePermissions.find({
          permission_id: _id,
        });
        if (roleHasPermission.length == 0) {
          const permissionDelete = {
            deleted_at: Date(),
          };
          try {
            await permission.findByIdAndUpdate(_id, permissionDelete);
            res
              .status(201)
              .json({ message: "Permission Deleted Successfully" });
          } catch (error) {
            if (error.name === "ValidationError") {
              const errorMessages = Object.values(error.errors).map(
                (err) => err.message
              );
              res.status(400).json({ errors: errorMessages.join(", ") });
            } else {
              console.error(error);
              res.status(500).json({ message: "Internal server error" });
            }
          }
        } else {
          res
            .status(400)
            .json({ errors: "Permission already assigned to role" });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.addRole = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const addRole = new Role({
          role_name: req.body.role_name,
          role_description: req.body.role_description,
        });
        try {
          await addRole.save();
          res.status(201).json({ message: "Role Created Successfully" });
        } catch (error) {
          if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map(
              (err) => err.message
            );
            res.status(400).json({ errors: errorMessages.join(", ") });
          } else {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
          }
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.roles = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Roles")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const roleData = await Role.find({ deleted_at: "null" }).select(
          "_id role_name role_description"
        );
        res.json({ roleData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.Roleedit = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const roleData = await Role.findById(_id).select(
          "_id role_name role_description"
        );
        res.json({ roleData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.Roleupdate = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const role = {
          role_name: req.body.role_name,
          role_description: req.body.role_description,
          permission_name: req.body.permission_name,
          updated_at: Date(),
        };
        Role.findByIdAndUpdate(_id, role, {
          runValidators: true,
          context: "query",
        })
          .then(async () => {
            res.status(201).json({ message: "Role Updated Successfully" });
          })
          .catch((error) => {
            if (error.name === "ValidationError") {
              // Extract error messages for 'holiday_name' and 'holiday_date'
              const errorMessages = Object.keys(error.errors).map(
                (key) => error.errors[key].message
              );
              // Send only the desired error messages
              res.status(400).json({ errors: errorMessages.join(", ") });
            } else {
              // Handle other types of errors
              console.error(error);
              res.status(500).json({ message: "Internal server error" });
            }
          });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.Roledelete = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Delete Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        var alreadyRole = await user.find({ role_id: _id });
        var userHasAlreadyRole = alreadyRole.toString().includes(_id);
        if (userHasAlreadyRole == true) {
          res.status(400).json({ errors: "Role already assigned to user" });
          // res.json({ deleteStatus: false, message: "Role Assigned To User" });
        } else {
          const deleteRole = {
            deleted_at: Date(),
          };
          await Role.findByIdAndUpdate(_id, deleteRole)
            .then(async () => {
              res.status(201).json({ message: "Role Deleted Successfully" });
            })
            .catch((error) => {
              if (error.name === "ValidationError") {
                // Extract error messages for 'holiday_name' and 'holiday_date'
                const errorMessages = Object.keys(error.errors).map(
                  (key) => error.errors[key].message
                );
                // Send only the desired error messages
                res.status(400).json({ errors: errorMessages.join(", ") });
              } else {
                // Handle other types of errors
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
              }
            });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getAddTask = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Task")
    .then(async (rolePerm) => {
      const user_id = req.user._id;
      if (rolePerm.status == true) {
        const adminProjectData = await project
          .find({ deleted_at: "null", status: { $ne: "Completed" } })
          .select("_id title");
        const projectData = await project
          .find({
            user_id: user_id,
            deleted_at: "null",

            status: { $ne: "Completed" },
          })
          .select("_id title")
          .sort({ created_at: -1 });
        // const roleData =  await Role.findOne({role_id:role_id})
        // const RoleName = roleData.role_name
        // if(RoleName=="Admin"){
        var userData = await user
          .find({ deleted_at: "null" })
          .select("firstname last_name");
        // }else{
        // var userData = await user.find({deleted_at:"null",_id:user_id}).select('firstname last_name');
        // }
        res.json({ adminProjectData, projectData, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.taskadd = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Task")
    .then((rolePerm) => {
      if (rolePerm.status == true) {
        task
          .create({
            project_id: req.body.project_id,
            user_id: req.body.user_id,
            title: req.body.title,
            short_description: req.body.short_description,
            task_type: req.body.task_type,
            task_estimation: req.body.task_estimation,
          })
          .then(async (Tasks) => {
            const assignedUser = await user
              .findById(req.body.user_id)
              .select("firstname last_name gender");
            if (req.user._id.toString() !== req.body.user_id) {
              logUserIdentity(
                req,
                `assigned a task to ${assignedUser.firstname} ${assignedUser.last_name}`,
                assignedUser._id
              );
            } else {
              logUserIdentity(
                req,
                `assigned a task to ${assignedUser.gender === "male" ? "him" : "her"
                }self`,
                assignedUser._id
              );
            }
            res.status(201).json(Tasks);
          })
          .catch((error) => {
            res.status(400).send(error);
          });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.listTasks = async (req, res) => {
  sess = req.session;
  const user_id = new BSON.ObjectId(req.user._id);

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Tasks")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        // const adminTaskdata = await task.find({ deleted_at: "null" });
        const tasksData = await task.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { user_id: user_id } },

          {
            $lookup: {
              from: "projects",
              localField: "project_id",
              foreignField: "_id",
              as: "projectData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $lookup: {
              from: "timeentries",
              localField: "_id",
              foreignField: "task_id",
              as: "timeEntryData",
            },
          },
          {
            $project: {
              "projectData.title": 1,
              "userData.firstname": 1,
              "userData.last_name": 1,
              title: 1,
              task_status: 1,
              task_type: 1,
              short_description: 1,
              task_estimation: 1,
              _id: 1,
              totalHours: {
                $reduce: {
                  input: {
                    $map: {
                      input: "$timeEntryData",
                      as: "hour",
                      in: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$$hour.hours", ""] },
                              { $gte: [{ $toDouble: "$$hour.hours" }, 0] },
                            ],
                          },
                          then: { $toDouble: "$$hour.hours" },
                          else: 0,
                        },
                      },
                    },
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this"] },
                },
              },
              estimatedHours: { $toDouble: "$task_estimation" },
            },
          },
          // {
          //   $addFields: {
          //     productivityFactor: {
          //       $cond: {
          //         if: {
          //           $gte: [{
          //             $round: [
          //               {
          //                 $divide: [
          //                   "$totalHours",

          //                   "$estimatedHours"

          //                 ]
          //               },
          //               2
          //             ]
          //           }, 100]
          //         },
          //         then: 100,
          //         else: {
          //           $round: [
          //             {
          //               $divide: [
          //                 "$totalHours",

          //                 "$estimatedHours"

          //               ]
          //               /* $divide: [
          //                 { $multiply: ["$estimatedHours", 100] },
          //                 {
          //                   $cond: {
          //                     if: { $eq: ["$totalHours", 0] },
          //                     then: 1,
          //                     else: "$totalHours"
          //                   }
          //                 }
          //               ] */
          //             },
          //             2
          //           ]
          //         }
          //       }
          //     }
          //   }
          // }
        ]);
        const adminTaskdata = await task.aggregate([
          { $match: { deleted_at: "null" } },
          {
            $lookup: {
              from: "projects",
              localField: "project_id",
              foreignField: "_id",
              as: "projectData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $lookup: {
              from: "timeentries",
              localField: "_id",
              foreignField: "task_id",
              as: "timeEntryData",
            },
          },
          {
            $project: {
              "projectData.title": 1,
              "userData.firstname": 1,
              "userData._id": 1,
              "userData.last_name": 1,
              title: 1,
              task_status: 1,
              task_type: 1,
              short_description: 1,
              task_estimation: 1,
              _id: 1,
              totalHours: {
                $reduce: {
                  input: {
                    $map: {
                      input: "$timeEntryData",
                      as: "hour",
                      in: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$$hour.hours", ""] },
                              { $gte: [{ $toDouble: "$$hour.hours" }, 0] },
                            ],
                          },
                          then: { $toDouble: "$$hour.hours" },
                          else: 0,
                        },
                      },
                    },
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this"] },
                },
              },
              estimatedHours: { $toDouble: "$task_estimation" },
            },
          },
          // {
          //   $addFields: {
          //     productivityFactor: {
          //       $cond: {
          //         if: {
          //           $gte: [{
          //             $round: [
          //               {
          //                 $divide: [
          //                   "$totalHours",

          //                   "$estimatedHours"

          //                 ]
          //               },
          //               2
          //             ]
          //           }, 100]
          //         },
          //         then: 100,
          //         else: {
          //           $round: [
          //             {
          //               $divide: [
          //                 "$totalHours",

          //                 "$estimatedHours"

          //               ]
          //             },
          //             2
          //           ]
          //         }
          //       }
          //     }
          //   }
          // }
        ]);
        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        const projectData = await project
          .find({ deleted_at: "null" })
          .select("_id title");
        if (tasksData == []) {
        } else {
          res.json({ tasksData, adminTaskdata, userData, projectData });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.taskedit = async (req, res) => {
  sess = req.session;

  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Task")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const projectData = await project
          .find({
            deleted_at: "null",
            user_id: user_id,
          })
          .select("_id title project_id");
        const adminProjectData = await project
          .find({
            deleted_at: "null",
          })
          .select("_id title project_id");

        const _id = new BSON.ObjectId(req.params.id);
        const tasks = await task.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { _id: _id } },
          {
            $lookup: {
              from: "projects",
              localField: "project_id",
              foreignField: "_id",
              as: "projectData", //test
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData", //test1
            },
          },
          {
            $lookup: {
              from: "timeentries",
              localField: "_id",
              foreignField: "task_id",
              as: "timeEntryData",
            },
          },
          {
            $project: {
              "projectData.title": 1,
              "userData.firstname": 1,
              "userData._id": 1,
              "userData.last_name": 1,
              task_type: 1,
              title: 1,
              project_id: 1,
              user_id: 1,
              task_status: 1,
              short_description: 1,
              _id: 1,
              task_estimation: 1,
              estimatedHours: { $toDouble: "$task_estimation" },
            },
          },
        ]);

        const adminTaskdata = await task.aggregate([
          { $match: { deleted_at: "null" } },
          {
            $lookup: {
              from: "projects",
              localField: "project_id",
              foreignField: "_id",
              as: "projectData", //test
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData", //test1
            },
          },
          {
            $project: {
              "projectData.title": 1,
              "projectData._id": 1,
              "userData.firstname": 1,
              "userData._id": 1,
              "userData.last_name": 1,
              title: 1,
              project_id: 1,
              user_id: 1,
              task_status: 1,
              short_description: 1,
              _id: 1,
            },
          },
        ]);
        res.json({ tasks, projectData, adminTaskdata, adminProjectData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.taskupdate = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Task")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const taskData = {
          project_id: req.body.project_id,
          user_id: req.body.user_id,
          title: req.body.title,
          short_description: req.body.short_description,
          task_estimation: req.body.task_estimation,
          task_type: req.body.task_type,
          updated_at: Date(),
        };

        await task.findByIdAndUpdate(_id, taskData);
        res.json("Task updeted done");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.task_status_update = async (req, res) => {
  const _id = req.params.id;
  const task_update = {
    task_status: "1",
    updated_at: Date(),
  };
  const updateTask = await task.findByIdAndUpdate(_id, task_update);
  res.json("Task updeted done");
};
apicontroller.taskdelete = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete Task")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const deleteTask = {
          deleted_at: Date(),
        };
        await task.findByIdAndUpdate(_id, deleteTask);
        res.json("task deleted");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getUserByProject = async (req, res) => {
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  const _id = new BSON.ObjectId(req.params.id);

  const roleData = await Role.findOne({ _id: role_id });
  const RoleName = roleData.role_name;

  try {
    if (RoleName == "Admin") {
      var tasks = await project.aggregate([
        { $match: { _id: _id } },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $project: {
            "userData.firstname": 1,
            "userData.last_name": 1,
            "userData._id": 1,
          },
        },
      ]);
    } else {
      var tasks = await project.aggregate([
        { $match: { _id: _id } },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", user_id] }],
                  },
                  deleted_at: "null",
                },
              },
            ],
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $project: {
            "userData.firstname": 1,
            "userData.last_name": 1,
            "userData._id": 1,
          },
        },
      ]);
    }
    return res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

apicontroller.listuser = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Employees")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const userData = await user.aggregate([
          { $match: { deleted_at: "null" } },
          {
            $lookup: {
              from: "roles",
              localField: "role_id",
              foreignField: "_id",
              as: "roleData", //test
            },
          },
          {
            $project: {
              "roleData.role_name": 1,
              "roleData._id": 1,
              firstname: 1,
              last_name: 1,
              photo: 1,
              company_email: 1,
              mo_number: 1,
              status: 1,
              doj: 1,
              emp_code: 1,
              _id: 1,
            },
          },
        ]);
        res.json({ userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.deleteduser = async (req, res) => {
  sess = req.session;

  const user_id = req.body;
  const userid = await user.find({
    deleted_at: {
      $ne: "null",
    },
  });
  res.json(userid);
};
apicontroller.deletedMany = async (req, res) => {
  sess = req.session;
  // const user_id = new BSON.ObjectId(req.body.multiDelete);
  const user_id = req.body.multiDelete;

  const updateEmployee = await user.updateMany(
    { _id: { $in: user_id } },
    { $set: { deleted_at: Date() } }
  );
  res.json({ status: "user deleted" });
};
apicontroller.restoreuser = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete Employee")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const updateUser = {
          deleted_at: "null",
        };
        const updateEmployee = await user.findByIdAndUpdate(_id, updateUser);

        res.json({ status: "user Restore", updateUser });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.userDetail = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Employees Details")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const user_id = new BSON.ObjectId(req.params.id);

        const userData = await user.findById(_id);

        const userDetailData = await user.aggregate([
          { $match: { _id: user_id } },
          { $addFields: { roleId: { $toObjectId: "$role_id" } } },
          {
            $lookup: {
              from: "roles",
              localField: "roleId",
              foreignField: "_id",
              as: "role",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "reporting_user_id",
              foreignField: "_id",
              as: "repoting_user",
            },
          },
        ]);
        res.json({
          data: userData,
          userDetailData: userDetailData,
          name: sess.name,
          loggeduserdata: req.user,
          users: sess.userData,
          role: sess.role,
          layout: false,
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.profile = async (req, res) => {
  sess = req.session;
  const _id = new BSON.ObjectId(req.params.id);

  try {
    const userData = await user.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { _id: _id } },
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "roleData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reporting_user_id",
          foreignField: "_id",
          as: "repoting_user",
        },
      },
      {
        $project: {
          "roleData.role_name": 1,
          "repoting_user.firstname": 1,
          "roleData._id": 1,
          firstname: 1,
          middle_name: 1,
          last_name: 1,
          mo_number: 1,
          dob: 1,
          doj: 1,
          gender: 1,
          company_email: 1,
          personal_email: 1,
          emp_code: 1,
          add_1: 1,
          add_2: 1,
          aadhar_number: 1,
          pan_number: 1,
          city: 1,
          state: 1,
          country: 1,
          bank_name: 1,
          bank_account_no: 1,
          ifsc_code: 1,
          user_name: 1,
          photo: 1,
          pincode: 1,
        },
      },
    ]);
    // const [InventoryItemData] = await assignInventory.aggregate([
    //   { $match: { deleted_at: "null", user_id: _id } },
    //   {
    //     $lookup: {
    //       from: "inventoryitems",
    //       localField: "inventoryItem_id",
    //       foreignField: "_id",
    //       as: "InventoryItemData",
    //     },
    //   },
    // ]);

    // console.log(InventoryItemData.InventoryItemData, "AssignInventoryData");

    const [AssignInventoryData] = await assignInventory.aggregate([
      { $match: { deleted_at: "null", user_id: _id } },
      {
        $lookup: {
          from: "inventoryitems",
          localField: "inventoryItem_id",
          foreignField: "_id",
          as: "InventoryItemData",
        },
      },
      {
        $lookup: {
          from: "cpuMasterInventories",
          localField: "InventoryItemData.cpu_data",
          foreignField: "_id",
          as: "CpuDataDetails",
        },
      },
    ]);

    const allCpuData = [];

    for (
      let i = 0;
      i < AssignInventoryData && AssignInventoryData.InventoryItemData.length;
      i++
    ) {
      const element = AssignInventoryData.InventoryItemData[i];
      const cpuData = await cpuInventory.find({
        _id: { $in: element.cpu_data },
      });

      if (cpuData.length > 0) {
        allCpuData.push(cpuData);
      }
    }

    res.json({
      userData,
      cpuData: allCpuData,
      AssignInventoryData:
        AssignInventoryData && AssignInventoryData.InventoryItemData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
apicontroller.updateProfile = async (req, res) => {
  // const _id = req.params.id;
  const _id = new BSON.ObjectId(req.params.id);
  try {
    var userData = await user.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { _id: _id } },
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "roleData",
        },
      },
    ]);

    if (userData[0].roleData[0].role_name == "Admin") {
      var updateUserProfile = {
        firstname: req.body.firstname,
        middle_name: req.body.middle_name,
        last_name: req.body.last_name,
        gender: req.body.gender,
        personal_email: req.body.personal_email,
        mo_number: req.body.mo_number,
        add_1: req.body.add_1,
        add_2: req.body.add_2,
        bank_account_no: req.body.bank_account_no,
        bank_name: req.body.bank_name,
        ifsc_code: req.body.ifsc_code,
        company_email: req.body.company_email,
        dob: req.body.dob,
        doj: req.body.doj,
        pan_number: req.body.pan_number,
        aadhar_number: req.body.aadhar_number,
        pincode: req.body.pincode,
        updated_at: Date(),
      };
    } else {
      var updateUserProfile = {
        firstname: req.body.firstname,
        middle_name: req.body.middle_name,
        last_name: req.body.last_name,
        gender: req.body.gender,
        personal_email: req.body.personal_email,
        mo_number: req.body.mo_number,
        add_1: req.body.add_1,
        add_2: req.body.add_2,
        pincode: req.body.pincode,
        updated_at: Date(),
      };
    }

    const updateProfile = await user.findByIdAndUpdate(_id, updateUserProfile);
    // const username = await user.findById(_id).select('firstname last_name');
    logger.info({
      message: `${updateProfile.firstname} ${updateProfile.last_name} updated ${updateProfile.gender === "male" ? "his" : "her"
        } profile`,
      user_id: updateProfile._id,
    });
    res.json({ updateProfile, message: "profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.editUserProfile = async (req, res) => {
  const _id = req.params.id;
  try {
    const updateProfilePhoto = {
      photo: req.files.photo.name,
    };
    var file = req.files.photo;
    const array_of_allowed_files = ["png", "jpeg", "jpg", "gif"];
    const imageName = file.name;
    const file_extension = imageName.split(".").pop();
    if (!array_of_allowed_files.includes(file_extension)) {
      var oldProfilePhoto = await user.findByIdAndUpdate(_id);
      var photo = oldProfilePhoto.photo;
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      file.mv("public/images/" + file.name);
      var ProfilePhotoUpdate = await user.findByIdAndUpdate(
        _id,
        updateProfilePhoto
      );
      var photo = ProfilePhotoUpdate.photo;
      res.send({ photo });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.addUserimage = async (req, res) => {
  try {
    const addImage = {
      photo: req.files.image.name,
    };
    var file = req.files.image;
    const array_of_allowed_files = ["png", "jpeg", "jpg", "gif"];
    const imageName = file.name;
    const file_extension = imageName.split(".").pop();
    if (!array_of_allowed_files.includes(file_extension)) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      file.mv("public/images/" + file.name);

      const addUser = new user({
        photo: req.files.image.name,
      });
      const addImage = await addUser.save();
      res.json({ status: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.updateUserPhoto = async (req, res) => {
  const _id = req.params.id;
  try {
    const updateProfilePhoto = {
      photo: req.files.image.name,
    };
    var file = req.files.image;
    const array_of_allowed_files = ["png", "jpeg", "jpg", "gif"];
    const imageName = file.name;
    const file_extension = imageName.split(".").pop();
    if (!array_of_allowed_files.includes(file_extension)) {
      var oldProfilePhoto = await user.findByIdAndUpdate(_id);
      var photo = oldProfilePhoto.photo;
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      file.mv("public/images/" + file.name);
      var ProfilePhotoUpdate = await user.findByIdAndUpdate(
        _id,
        updateProfilePhoto
      );
      var photo = ProfilePhotoUpdate.photo;
      res.send({ photo });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.userprofilephoto = async (req, res) => {
  const _id = req.params.id;
  try {
    const updateProfilePhoto = {
      photo: req.body.photo,
    };
    const ProfilePhotoUpdate = await user.findByIdAndUpdate(
      _id,
      updateProfilePhoto
    );
    res.json({ ProfilePhotoUpdate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

apicontroller.editUser = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Update Employee")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const userData = await user.findById(_id);
        const role = await Role.find({ deleted_at: "null" }).select(
          "_id role_name"
        );
        const cities = await city.find().select("city");
        const users = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name emp_code");
        res.json({ role, userData, users, cities });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.UpdateUser = async (req, res) => {
  console.log("ave che update user ma");
  sess = req.session;
  const _id = req.params.id;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Employee")
    .then(async (rolePerm) => {
      console.log("rolePerm", rolePerm);
      if (rolePerm.status == true) {
        if (!req.files) {
          console.log("if");
          const updateuser = {
            role_id: req.body.role_id,
            emp_code: req.body.emp_code,
            reporting_user_id: req.body.reporting_user_id,
            firstname: req.body.firstname,
            user_name: req.body.user_name,
            middle_name: req.body.middle_name,
            last_name: req.body.last_name,
            gender: req.body.gender,
            dob: req.body.dob,
            doj: req.body.doj,
            personal_email: req.body.personal_email,
            company_email: req.body.company_email,
            mo_number: req.body.mo_number,
            pan_number: req.body.pan_number,
            aadhar_number: req.body.aadhar_number,
            add_1: req.body.add_1,
            add_2: req.body.add_2,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            pincode: req.body.pincode,
            status: req.body.status,
            bank_account_no: req.body.bank_account_no,
            bank_name: req.body.bank_name,
            ifsc_code: req.body.ifsc_code,
            updated_at: Date(),
          };
          await user.findByIdAndUpdate(_id, updateuser);

          const updatedUser = await user.findById(_id);
          const leavesSettingData = await Settings.find({ key: "leaves" });
          // userData.forEach(async user => {
          const doj = updatedUser.doj;
          console.log(doj, " ::doj");
          const dojYear = doj.getFullYear();
          const dojMonth = doj.getMonth() + 1; // Adding 1 because months are zero-based

          // console.log(dojMonth, " ::dojYear")
          let workingMonths;
          let totalLeaves = parseInt(leavesSettingData[0].value);
          let academicYear;
          if (dojMonth >= 4) {
            workingMonths = 12 - (dojMonth - 4); // Corrected subtraction
            console.log("workingMonths", workingMonths);
            academicYear = `${dojYear}-${dojYear + 1}`;
          } else {
            workingMonths = 4 - doj.getMonth();
            academicYear = `${dojYear - 1}-${dojYear}`;
          }
          totalLeaves = Math.floor((totalLeaves / 12) * workingMonths);
          const takenLeaves = await leaves
            .find({
              user_id: updatedUser._id,
              deleted_at: "null",
              status: "APPROVED",
            })
            .select("total_days");
          let totaldays = 0;
          takenLeaves.forEach((leaves) => {
            totaldays += parseFloat(leaves.total_days);
          });
          const remainingLeaves = totalLeaves - totaldays;
          console.log(totalLeaves, " ::remainingLeaves");

          const userHistory = {
            user_id: updatedUser._id,
            year: academicYear,
            total_leaves: totalLeaves,
            taken_leaves: totaldays,
            remaining_leaves: remainingLeaves,
          };

          const userLeaveHistory = await leaveHistory.findOne({
            user_id: updatedUser._id,
            year: academicYear,
          });

          await leaveHistory.findByIdAndUpdate(
            userLeaveHistory._id,
            userHistory
          );
        } else {
          console.log("else");

          let file = req.files.photo;
          file.mv("public/images/" + file.name);
          const updateuser = {
            role_id: req.body.role_id,
            emp_code: req.body.emp_code,
            reporting_user_id: req.body.reporting_user_id,
            firstname: req.body.firstname,
            user_name: req.body.user_name,
            middle_name: req.body.middle_name,
            last_name: req.body.last_name,
            gender: req.body.gender,
            dob: req.body.dob,
            doj: req.body.doj,
            personal_email: req.body.personal_email,
            company_email: req.body.company_email,
            mo_number: req.body.mo_number,
            pan_number: req.body.pan_number,
            aadhar_number: req.body.aadhar_number,
            add_1: req.body.add_1,
            add_2: req.body.add_2,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            pincode: req.body.pincode,
            photo: file.name,
            bank_account_no: req.body.bank_account_no,
            bank_name: req.body.bank_name,
            ifsc_code: req.body.ifsc_code,
          };
          const updateUser = await user.findByIdAndUpdate(_id, updateuser);

          const leavesSettingData = await Settings.find({ key: "leaves" });
          // userData.forEach(async user => {
          const doj = updateUser.doj;
          const dojYear = doj.getFullYear();
          const dojMonth = doj.getMonth() + 1; // Adding 1 because months are zero-based
          let workingMonths;
          let totalLeaves = parseInt(leavesSettingData[0].value);
          let academicYear;
          if (dojMonth >= 4) {
            workingMonths = 12 - (dojMonth - 4);
            console.log("workingMonths", workingMonths);
            academicYear = `${dojYear}-${dojYear + 1}`;
          } else {
            workingMonths = dojMonth + 2;
            academicYear = `${dojYear - 1}-${dojYear}`;
          }
          totalLeaves = Math.floor(totalLeaves / 12) * workingMonths;
          const payload = new leaveHistory({
            user_id: updateUser._id,
            year: academicYear,
            total_leaves: totalLeaves,
            taken_leaves: 0,
            remaining_leaves: totalLeaves,
          });
          const userLeavesData = payload.save();
        }
        res.json({ status: true, message: "user successfully updated" });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.index = async (req, res) => {
  sess = req.session;
  const user_id = req.user?._id;
  const userRole = req.user.role[0]?.role_name;
  try {
    const userData = await userApi.allUsers();
    const userPending = await user.countDocuments({
      status: "Pending",
      deleted_at: "null",
    });
    const ExEmployee = await user.countDocuments({
      status: "ExEmployee",
      deleted_at: "null",
    });
    const userActive = await user.countDocuments({
      status: "Active",
      deleted_at: "null",
    });
    const userInActive = await user.countDocuments({
      status: "InActive",
      deleted_at: "null",
    });
    const projectFind = {
      deleted_at: "null",
      user_id: user_id,
    };
    userRole === "Admin" && delete projectFind.user_id;
    const projectData = await project.countDocuments(projectFind);
    const endMonth = moment().month() + 1 < 4;
    const currentYear = endMonth
      ? moment().subtract(1, "year").year()
      : moment().year();
    const thisyear = `${currentYear}-${currentYear + 1}`;
    const leaveHistoryData = await leaveHistory.findOne({
      deleted_at: "null",
      user_id: user_id,
      year: thisyear,
    });
    const totalLeavesData = await Settings.findOne({
      key: "leaves",
      deleted_at: "null",
    });
    const _id = new BSON.ObjectId(user_id);
    const usersdata = await user.find({ reporting_user_id: _id });
    var reporting_user_id = [];
    for (let i = 0; i < usersdata.length; i++) {
      element = usersdata[i]._id;
      reporting_user_id.push(element);
    }
    const dataholiday = await holiday
      .find({ deleted_at: "null", holiday_date: { $gt: new Date() } })
      .sort({ holiday_date: 1 });
    const allLeavesData = await leaves.find({
      deleted_at: "null",
      user_id: reporting_user_id,
      status: "PENDING",
    });
    var today = new Date().toISOString().split("T")[0];
    const announcementData = await Announcement.find({
      date: { $gte: today },
    }).sort({ date: 1 });
    const userId = new BSON.ObjectId(user_id);
    const allProjectData = await project.aggregate([
      {
        $match: {
          deleted_at: "null",
        },
      },
      {
        $match: {
          $expr: {
            $cond: {
              if: { $eq: [userRole, "Admin"] },
              then: true,
              else: { $in: [new BSON.ObjectId(req.user._id), "$user_id"] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          "userData.firstname": 1,
          "userData.last_name": 1,
        },
      },
    ]);
    const pendingTaskFind = {
      deleted_at: "null",
      $or: [{ task_status: "0" }, { task_status: 0 }],
      user_id: user_id,
    };
    userRole === "Admin" && delete pendingTaskFind.user_id;
    const pendingTaskData = await task.countDocuments(pendingTaskFind);
    const leavesUser = await user.find({
      deleted_at: "null",
      reporting_user_id: user_id,
    });
    const userwiserequest = [];
    for (let i = 0; i < leavesUser.length; i++) {
      const element = leavesUser[i]._id;
      userwiserequest.push(element);
    }
    const leavesrequestData = await leaves.countDocuments({
      status: "PENDING",
      deleted_at: "null",
      user_id: userwiserequest,
    });
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const holidayData = await holiday
      .find({
        $expr: {
          $and: [
            {
              $eq: [
                {
                  $month: "$holiday_date",
                },
                month,
              ],
            },
            {
              $eq: [
                {
                  $year: "$holiday_date",
                },
                year,
              ],
            },
          ],
        },
        deleted_at: "null",
        holiday_date: { $gt: new Date() },
      })
      .sort({ holiday_date: 1 });
    // const currentMonth = new Date().getMonth() + 1;
    // const currentYearNow = new Date().getFullYear();
    // const totalAverage = await punchController.getAverageByEmployee(currentYearNow, currentMonth, employeeId = 13, userId);
    res.json({
      leaveHistoryData,
      totalLeavesData,
      userData,
      userPending,
      ExEmployee,
      userActive,
      userInActive,
      projectData,
      allProjectData,
      dataholiday,
      pendingTaskData,
      announcementData,
      allLeavesData,
      leavesUser,
      leavesrequestData,
      holidayData,
      // projecthold,
      // projectinprogress,
      // projectcompleted,
      // taskData,
      // settingData,
      // projectHashTask,
      // pendingUserTaskData,
      // referuserData,
      // projectUserData,
      // projectholdUser,
      // projectinprogressUser,
      // projectcompletedUser,
      // taskUserData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
apicontroller.indexWorkingHour = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay() + 0); // Monday
    // Calculate the end date of the current week (Friday)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - endDate.getDay() + 5); // Friday
    const userMatch = req.body.user_id
      ? [{ user_id: new BSON.ObjectId(req.body.user_id) }]
      : [];

    const filters = [{ date: { $gt: startDate, $lte: endDate } }, ...userMatch];
    const workingHourDataByWeek = await workingHour
      .find({ $and: filters })
      .select("-_id date total_hour end_time start_time")
      .sort({ date: 1 });
    const groupedData = {};
    for (let i = 0; i < workingHourDataByWeek.length; i++) {
      const data = workingHourDataByWeek[i];
      if (!groupedData[data.date]) {
        groupedData[data.date] = [];
      }
      groupedData[data.date].push(data);
    }

    const breakData = [];
    for (const date in groupedData) {
      const dayData = groupedData[date];
      for (let i = 0; i < dayData.length - 1; i++) {
        var start = dayData[i].end_time;
        var end = dayData[i + 1].start_time;
        var start_moment = moment(start, "HH:mm");
        var end_moment = moment(end, "HH:mm");
        var totalDiffMinutes = end_moment.diff(start_moment, "minutes");
        var totalDiffHours = Math.floor(totalDiffMinutes / 60);
        var diffMinutes = totalDiffMinutes % 60;
        var totalBreak =
          ("0" + totalDiffHours).slice(-2) +
          ":" +
          ("0" + diffMinutes).slice(-2);

        breakData.push({
          start_time: dayData[i].end_time,
          date: dayData[i].date,
          end_time: dayData[i + 1].start_time,
          break: totalBreak,
        });
      }
    }

    const weekHourBreakDates = [];
    for (
      let i = new Date(startDate);
      i <= endDate;
      i.setDate(i.getDate() + 1)
    ) {
      if (i.getDay() !== 0) {
        weekHourBreakDates.push(i.toISOString().slice(0, 10));
      }
    }
    //breakHours breakHourData weekHourBreakDates
    const breakHourData = weekHourBreakDates.reduce((acc, date) => {
      acc[date] = 0;
      for (const value of breakData) {
        const valueDate = value.date.toISOString().slice(0, 10);
        if (valueDate === date) {
          const [hourStr, minuteStr] = value.break.split(":");
          const hoursInMinutes = parseInt(hourStr, 10) * 60;
          const minutes = parseInt(minuteStr, 10);
          const totalMinutes = hoursInMinutes + minutes;
          acc[date] += totalMinutes;
        }
      }
      return acc;
    }, {});
    const breakHours = [];

    const brHours = Object.values(breakHourData).map((hour) => {
      if (hour < 0.59) {
        return hour;
      }
      const parsedHour = parseFloat(hour.toFixed(2));
      const hourInt = Math.floor(parsedHour);
      const minuteDecimal = parsedHour - hourInt;
      const minuteInt = Math.round(minuteDecimal * 100);
      let totalMinutes = hourInt * 60 + minuteInt;
      totalMinutes = Math.round(totalMinutes / 30) * 30;
      const roundedHourInt = Math.floor(totalMinutes / 60);
      const finalMinuteInt = totalMinutes % 60;
      return roundedHourInt + finalMinuteInt / 100;
    });
    brHours.map((value) => {
      return breakHours.push(parseFloat(convertMinutesToHours(value)));
    });

    //weekHours
    const weekDates = [];
    for (
      let i = new Date(startDate);
      i <= endDate;
      i.setDate(i.getDate() + 1)
    ) {
      if (i.getDay() !== 0) {
        weekDates.push(i.toISOString().slice(0, 10));
      }
    }

    // accumulate total hours for each day in the week
    const workHourData = weekDates.reduce((acc, date) => {
      acc[date] = 0;
      for (const value of workingHourDataByWeek) {
        const valueDate = value.date.toISOString().slice(0, 10);
        if (valueDate === date) {
          const [hourStr, minuteStr] = value.total_hour.split(":");
          const hoursInMinutes = parseInt(hourStr, 10) * 60;
          const minutes = parseInt(minuteStr, 10);
          const totalMinutes = hoursInMinutes + minutes;
          acc[date] += totalMinutes;
        }
      }
      return acc;
    }, {});

    function convertMinutesToHours(minutes) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}.${remainingMinutes.toString().padStart(2, "0")}`;
    }
    const weeklyHours = [];
    const wDate = Object.values(workHourData).map((hour) => {
      if (hour < 0.59) {
        return hour;
      }
      const parsedHour = parseFloat(hour.toFixed(2));
      const hourInt = Math.floor(parsedHour);
      const minuteDecimal = parsedHour - hourInt;
      const minuteInt = Math.round(minuteDecimal * 100);
      let totalMinutes = hourInt * 60 + minuteInt;
      totalMinutes = Math.round(totalMinutes / 30) * 30;
      const roundedHourInt = Math.floor(totalMinutes / 60);
      const finalMinuteInt = totalMinutes % 60;
      return roundedHourInt + finalMinuteInt / 100;
    });
    wDate.map((value) => {
      return weeklyHours.push(parseFloat(convertMinutesToHours(value)));
    });
    res.json({ weeklyHours, breakHours });
  } catch (e) { }
};
apicontroller.deleteUser = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Delete Employee")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const updateUser = {
          deleted_at: Date(),
        };
        const updateEmployee = await user.findByIdAndUpdate(_id, updateUser);
        res.json({ status: "user deleted", updateUser });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.sendforget = async (req, res) => {
  try {
    const Email = req.body.company_email;
    const emailExists = await user.findOne({ company_email: Email });
    if (emailExists) {
      let token = await emailtoken.findOne({ userId: emailExists._id });
      if (!token) {
        token = await new emailtoken({
          userId: emailExists._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }
      const link = `${process.env.BASE_URL}/change_pwd/${emailExists._id}/${token.token}`;
      await sendEmail(
        emailExists.company_email,
        emailExists.firstname,
        emailExists._id,
        link,
        token.token
      );
      res.json({ status: 1, message: "Email Sent Successfully" });
    } else {
      res.json({ status: 0, message: "User Not found" });
    }
  } catch {
    res.send("noooo");
  }
};
apicontroller.change = async (req, res) => {
  const _id = req.params.id;
  const tokenid = req.params.token;
  const password = req.body.password;
  const cpassword = req.body.cpassword;

  const users = await user.findById(req.params.id);

  if (!user)
    return res
      .status(400)
      .send({ tokenStatus: false, message: "invalid link or expired" });
  const token = await emailtoken.findOne({
    userId: users._id,
    token: req.params.token,
  });
  if (!token)
    return res
      .status(400)
      .json({ tokenStatus: false, message: "invalid link or expired" });

  if (!(password == cpassword)) {
    res.json({ success: "please check confirm password" });
  } else {
    const passswords = await bcrypt.hash(req.body.password, 10);
    const updatepassword = {
      password: passswords,
    };
    const updatPssword = await user.findByIdAndUpdate(_id, updatepassword);

    await token.delete();
    res.json({ status: "password updated" });
  }
};
apicontroller.checktoken = async (req, res) => {
  const _id = req.params.id;
  const tokenid = req.params.token;
  const password = req.body.password;
  const cpassword = req.body.cpassword;

  const users = await user.findById(req.params.id);

  if (!user)
    return res
      .status(400)
      .json({ tokenStatus: false, message: "invalid link or expired" });
  const token = await emailtoken.findOne({
    userId: users._id,
    token: tokenid,
  });
  if (!token)
    return res
      .status(400)
      .json({ tokenStatus: false, message: "invalid link or expired" });
};
apicontroller.employeeLavesList = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  sess = req.session;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const employeeLeaves = await leaves
          .find({
            user_id: user_id,
            deleted_at: "null",
          })
          .select(
            "reason total_days datefrom dateto status half_day paid_status paid_leaves unpaid_leaves"
          );
        res.json({ employeeLeaves });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getaddleaves = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const holidayData = await holiday
          .find({ deleted_at: "null" })
          .select("holiday_date");

        var allHolidayDate = [];

        holidayData.forEach((holiday_date) => {
          allHolidayDate.push(holiday_date.holiday_date);
        });
        const existLeaveData = await leaves
          .find({
            $or: [{ status: "APPROVED" }, { status: "PENDING" }],
            user_id,
            deleted_at: "null",
          })
          .select("datefrom dateto");

        var existLeaveDates = [];
        existLeaveData.forEach((leaves) => {
          existLeaveDates.push({
            datefrom: leaves.datefrom,
            dateto: leaves.dateto,
          });
        });
        res.json({
          holidayData,
          allHolidayDate,
          existLeaveDates: [...new Set(existLeaveDates)],
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.addleaves = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  var usreData = await user.findById(req.user._id);
  var reportingData = await user.findById(req.user.reporting_user_id);

  var link = `${process.env.BASE_URL}/viewleavesrequest/`;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        var is_adhoc = req.body.is_adhoc;
        // const holidayData = await holiday
        //   .find({ deleted_at: "null" })
        //   .select("holiday_date");
        // var startDate = req.body.datefrom;
        // var endDate = req.body.dateto;
        // var halfday = req.body.half_day;
        // const startDAte = new Date(startDate);
        // const endDAte = new Date(endDate);
        // const oneDay = 24 * 60 * 60 * 1000;
        // if (halfday == "") {
        //   var diffDays =
        //     Math.round(Math.abs((endDAte - startDAte) / oneDay)) + 1;
        // } else {
        //   var diffDays =
        //     Math.round(Math.abs((endDAte - startDAte) / oneDay)) + 1 / 2;
        // }
        // let sundayCount = 0;
        // for (let i = 0; i < diffDays; i++) {
        //   const currentDate = new Date(startDAte.getTime() + i * oneDay);
        //   if (currentDate.getDay() === 0) {
        //     sundayCount++;
        //   }
        // }

        // let holidayCount = 0;
        // for (let i = 0; i < holidayData.length; i++) {
        //   const holidayDate = new Date(holidayData[i].holiday_date);
        //   if (startDAte <= holidayDate && endDAte >= holidayDate) {
        //     holidayCount++;
        //   }
        // }
        // // let holidayCount = 0
        // var total_days = diffDays - sundayCount - holidayCount;

        const startYear = new Date(req.body.datefrom).getFullYear();
        const startMonth = new Date(req.body.datefrom).getMonth() + 1; // Adding 1 because months are zero-based
        let academicYear;
        if (startMonth >= 4) {
          academicYear = `${startYear}-${startYear + 1}`;
        } else {
          academicYear = `${startYear - 1}-${startYear}`;
        }
        const leaveHistoryData = await leaveHistory.findOne({
          year: academicYear,
          user_id: user_id,
        });

        const userPaidStatus =
          leaveHistoryData.remaining_leaves > 0 ? "PAID" : "UNPAID";
        const userLeaves =
          leaveHistoryData.remaining_leaves - req.body.totalLeaveDay;
        let paidLeavesCount = 0;
        let unpaidLeavesCount = 0;

        if (userLeaves < 0) {
          paidLeavesCount = leaveHistoryData.remaining_leaves;
          unpaidLeavesCount = Math.abs(userLeaves);
        } else {
          paidLeavesCount = req.body.totalLeaveDay;
        }

        if (is_adhoc == 1) {
          const addLeaves = new leaves({
            user_id: req.user._id,
            is_adhoc: req.body.is_adhoc,
            datefrom: req.body.datefrom,
            dateto: req.body.dateto,
            total_days: req.body.totalLeaveDay,
            reason: req.body.reason,
            half_day: req.body.half_day,
            status: "APPROVED",
            paid_status: userPaidStatus,
            paid_leaves: paidLeavesCount,
            unpaid_leaves: unpaidLeavesCount,
            approver_id: reportingData?._id,
          });
          var datefrom = req.body.datefrom;
          var dateto = req.body.dateto;
          var reason = req.body.reason;
          var dateparts = datefrom.split("-");
          var DateFrom = dateparts[2] + "-" + dateparts[1] + "-" + dateparts[0];

          var datetoparts = dateto.split("-");
          var DateTo =
            datetoparts[2] + "-" + datetoparts[1] + "-" + datetoparts[0];
          const leavesadd = await addLeaves.save();

          console.log(leavesadd);

          if (leaveHistoryData) {
            const takenLeavesToUpdate =
              parseFloat(leaveHistoryData.taken_leaves) +
              parseFloat(leavesadd.total_days);

            if (leavesadd.paid_status == "PAID") {
              if (leavesadd.unpaid_leaves > 0) {
                await leaveHistory.updateOne(
                  { _id: leaveHistoryData._id },
                  {
                    $set: {
                      taken_leaves: takenLeavesToUpdate,
                      remaining_leaves:
                        parseFloat(leaveHistoryData.remaining_leaves) -
                        parseFloat(leavesadd.paid_leaves),
                      unpaid_leaves: Math.abs(
                        parseFloat(leaveHistoryData.unpaid_leaves) +
                        leavesadd.unpaid_leaves
                      ),
                    },
                  }
                );
              } else {
                await leaveHistory.updateOne(
                  { _id: leaveHistoryData._id },
                  {
                    $set: {
                      taken_leaves: takenLeavesToUpdate,
                      remaining_leaves:
                        parseFloat(leaveHistoryData.remaining_leaves) -
                        parseFloat(leavesadd.paid_leaves),
                    },
                  }
                );
              }
            } else {
              await leaveHistory.updateOne(
                { _id: leaveHistoryData._id },
                {
                  $set: {
                    taken_leaves: takenLeavesToUpdate,
                    unpaid_leaves: Math.abs(
                      parseFloat(leaveHistoryData.unpaid_leaves) +
                      parseFloat(leavesadd.total_days)
                    ),
                  },
                }
              );
            }
            // Update the document
            // await leaveHistory.updateOne(
            //   { _id: leaveHistoryData._id },
            //   {
            //     $set: {
            //       taken_leaves: takenLeavesToUpdate,
            //       remaining_leaves:
            //         parseFloat(leaveHistoryData.remaining_leaves) -
            //         parseFloat(leavesadd.total_days),
            //     },
            //   }
            // );
            console.log("Leave history updated successfully.");
          }
          await sendleaveEmail(
            usreData.firstname,
            DateFrom,
            DateTo,
            reason,
            reportingData?.firstname,
            reportingData?.company_email,
            link,
            is_adhoc
          );

          const message =
            req.body.totalLeaveDay <= 1
              ? `${usreData.firstname} ${usreData.last_name} added ${req.body.totalLeaveDay < 1 ? "half" : req.body.totalLeaveDay
              } day leave in ad-hoc`
              : `${usreData.firstname} ${usreData.last_name} added ${req.body.totalLeaveDay} days leave in ad-hoc`;
          logger.info({ message, user_id, refId: usreData?.reporting_user_id });
          res.json("leaves add done");
        } else {
          const addLeaves = new leaves({
            user_id: req.body.user_id,
            datefrom: req.body.datefrom,
            dateto: req.body.dateto,
            reason: req.body.reason,
            paid_status: userPaidStatus,
            half_day: req.body.half_day,
            total_days: req.body.totalLeaveDay,
            paid_leaves: paidLeavesCount,
            unpaid_leaves: unpaidLeavesCount,
          });
          var is_adhoc = 0;
          const leavesadd = await addLeaves.save();
          var datefrom = req.body.datefrom;
          var dateto = req.body.dateto;
          var reason = req.body.reason;

          // const usreData = await user.findById(req.user._id)
          // const reportingData = await user.findById(req.user.reporting_user_id)
          var dateparts = datefrom.split("-");
          var DateFrom = dateparts[2] + "-" + dateparts[1] + "-" + dateparts[0];

          var datetoparts = dateto.split("-");
          var DateTo =
            datetoparts[2] + "-" + datetoparts[1] + "-" + datetoparts[0];
          await sendleaveEmail(
            usreData.firstname,
            DateFrom,
            DateTo,
            reason,
            reportingData?.firstname,
            reportingData?.company_email,
            link,
            is_adhoc
          );
          const message =
            req.body.totalLeaveDay <= 1
              ? `${usreData.firstname} ${usreData.last_name} requested for ${req.body.totalLeaveDay < 1 ? "half" : req.body.totalLeaveDay
              } day leave`
              : `${usreData.firstname} ${usreData.last_name} requested for ${req.body.totalLeaveDay} days leave`;
          logger.info({ message, user_id, refId: usreData.reporting_user_id });
          res.json("leaves add done");
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error.message);
    });
};
apicontroller.leavesrequest = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const _id = new BSON.ObjectId(user_id);
  sess = req.session;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Leaves Request")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const usersdata = await user.find({ reporting_user_id: _id });
        var reporting_user_id = [];
        for (let i = 0; i < usersdata.length; i++) {
          element = usersdata[i]._id;
          reporting_user_id.push(element);
        }
        const allLeaves = await leaves.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { status: { $ne: "CANCELLED" } } },
          { $match: { user_id: { $in: reporting_user_id } } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $project: {
              "userData.firstname": 1,
              "userData._id": 1,
              reason: 1,
              datefrom: 1,
              dateto: 1,
              total_days: 1,
              paid_status: 1,
              status: 1,
              is_adhoc: 1,
              half_day: 1,
            },
          },
        ]);

        const adminLeavesrequest = await leaves.aggregate([
          { $match: { deleted_at: "null" } },
          { $match: { status: { $ne: "CANCELLED" } } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $project: {
              "userData.firstname": 1,
              "userData._id": 1,
              reason: 1,
              datefrom: 1,
              dateto: 1,
              is_adhoc: 1,
              half_day: 1,
              total_days: 1,
              paid_status: 1,
              status: 1,
              created_at: 1,
            },
          },
          {
            $addFields: {
              statusOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$status", "PENDING"] }, then: 1 },
                    { case: { $eq: ["$status", "APPROVED"] }, then: 2 },
                    { case: { $eq: ["$status", "REJECTED"] }, then: 3 },
                    // Add more branches if needed for other status values
                  ],
                  default: 4, // Default value for any other status not covered
                },
              },
            },
          },
          { $sort: { statusOrder: 1, datefrom: -1 } }, // Sort by the new statusOrder field
        ]);

        console.log("adminLeavesrequests", adminLeavesrequest);

        // Now adminLeavesrequest contains the leaves sorted by status

        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");

        res.json({ allLeaves, adminLeavesrequest, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.leavesList = async (req, res) => {
  sess = req.session;
  const user_id = req.user?._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const allLeaves = await leaves.aggregate([
          { $match: { deleted_at: "null" } },
          // { $match: { status: "APPROVE" } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData", ////////test
            },
          },
        ]);
        res.json({ allLeaves });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.cancelLeaves = async (req, res) => {
  try {
    const _id = req.params.id;
    const userData = req.user;
    const cancelLeaves = {
      status: "CANCELLED",
      approver_id: req.body.approver_id,
      deleted_at: new Date(),
    };
    const leavescancel = await leaves.findByIdAndUpdate(_id, cancelLeaves);
    logger.info({
      message: `${userData.firstname} ${userData.last_name} canceled ${userData.gender === "male" ? "his" : "her"
        } leave`,
      user_id: userData._id,
      refId: userData.reporting_user_id,
    });
    res.json({ leavescancel });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.rejectLeaves = async (req, res) => {
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Accept Or Reject Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const rejectLeaves = {
          status: "REJECTED",
          approver_id: req.body.approver_id,
        };
        var link = `${process.env.BASE_URL}/employeeLeavesList/`;
        const leavesReject = await leaves.findByIdAndUpdate(_id, rejectLeaves);
        const usreData = await user.findById(leavesReject.user_id);
        var reportingData = await user.findById(req.user._id);
        var datefrom = leavesReject.datefrom;
        var dateto = leavesReject.dateto;
        var status = leavesReject.status;
        var reason = leavesReject.reason;
        const df = new Date(datefrom);
        const DateFrom = `${df.getDate().toString().padStart(2, "0")}-${(
          df.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${df.getFullYear()}`;
        const dt = new Date(dateto);
        const DateTo = `${dt.getDate().toString().padStart(2, "0")}-${(
          dt.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${dt.getFullYear()}`;
        await sendAcceptRejctEmail(
          usreData.firstname,
          DateFrom,
          DateTo,
          reason,
          "Rejected",
          reportingData.firstname,
          usreData.company_email,
          link
        );
        res.json({ leavesReject });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.approveLeaves = async (req, res) => {
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Accept Or Reject Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const approveLeaves = {
          status: "APPROVED",
          approver_id: user_id,
          paid_status: req.body.paidStatus,
        };
        const leaveData = await leaves.findById(_id);
        const startDate = new Date(leaveData.datefrom);
        const endDate = new Date(leaveData.dateto);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1; // Adding 1 because months are zero-based
        let academicYear;
        if (startMonth >= 4) {
          academicYear = `${startYear}-${startYear + 1}`;
        } else {
          academicYear = `${startYear - 1}-${startYear}`;
        }
        const leavesapprove = await leaves.findByIdAndUpdate(
          _id,
          approveLeaves
        );

        const leaveHistoryData = await leaveHistory.findOne({
          year: academicYear,
          user_id: leaveData.user_id,
        });

        const userLeavesData = await leaves.findById(_id);

        console.log("userLeavesData", userLeavesData);
        if (leaveHistoryData) {
          const takenLeavesToUpdate =
            parseFloat(leaveHistoryData.taken_leaves) +
            parseFloat(userLeavesData.total_days);
          if (userLeavesData.paid_status == "PAID") {
            if (userLeavesData.unpaid_leaves > 0) {
              await leaveHistory.updateOne(
                { _id: leaveHistoryData._id },
                {
                  $set: {
                    taken_leaves: takenLeavesToUpdate,
                    remaining_leaves:
                      parseFloat(leaveHistoryData.remaining_leaves) -
                      parseFloat(userLeavesData.paid_leaves),
                    unpaid_leaves: Math.abs(
                      parseFloat(leaveHistoryData.unpaid_leaves) +
                      userLeavesData.unpaid_leaves
                    ),
                  },
                }
              );
            } else {
              await leaveHistory.updateOne(
                { _id: leaveHistoryData._id },
                {
                  $set: {
                    taken_leaves: takenLeavesToUpdate,
                    remaining_leaves:
                      parseFloat(leaveHistoryData.remaining_leaves) -
                      parseFloat(userLeavesData.paid_leaves),
                  },
                }
              );
            }
          } else {
            await leaveHistory.updateOne(
              { _id: leaveHistoryData._id },
              {
                $set: {
                  taken_leaves: takenLeavesToUpdate,
                  unpaid_leaves: Math.abs(
                    parseFloat(leaveHistoryData.unpaid_leaves) +
                    parseFloat(userLeavesData.total_days)
                  ),
                },
              }
            );
          }

          console.log("Leave history updated successfully.");
        } else {
          // Handle the case where no document is found for the specified academic year and user ID
          console.log(
            "No leave history found for the specified academic year and user ID."
          );
        }
        var link = `${process.env.BASE_URL}/employeeLeavesList/`;
        const usreData = await user.findById(userLeavesData.user_id);
        var reportingData = await user.findById(req.user._id);
        var datefrom = userLeavesData.datefrom;
        var dateto = userLeavesData.dateto;
        var reason = userLeavesData.reason;
        var status = userLeavesData.status;

        const df = new Date(datefrom);
        const DateFrom = `${df.getDate().toString().padStart(2, "0")}-${(
          df.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${df.getFullYear()}`;

        const dt = new Date(dateto);
        const DateTo = `${dt.getDate().toString().padStart(2, "0")}-${(
          dt.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${dt.getFullYear()}`;

        await sendAcceptRejctEmail(
          usreData.firstname,
          DateFrom,
          DateTo,
          reason,
          "Accepted",
          reportingData.firstname,
          usreData.company_email,
          link
        );
        res.json({ userLeavesData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getTimeEntry = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const user_id = req.user._id;
        const projectData = await project
          .find({
            user_id: user_id,
            status: "in Progress",
            deleted_at: "null",
          })
          .sort({ created_at: -1 });
        const validTimeEntryDays = await Settings.findOne({
          key: "ValidTimeEntryDays",
        });
        const timeEntryRequestData = await timeEntryRequest.find({
          status: "1",
          user_id: user_id,
        });
        const validDays = validTimeEntryDays.value;
        const holidayData = await holiday.find({ deleted_at: "null" });
        const userLeavesdata = await leaves.find({
          deleted_at: "null",
          status: "APPROVED",
          half_day: "",
          user_id: req.user._id,
        });
        res.json({
          projectData,
          timeEntryRequestData,
          validDays,
          holidayData,
          userLeavesdata,
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      console.log(e, "error");
      res.status(403).send(e);
    });
};
apicontroller.getAddWorkingHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const user_id = req.user._id;

        res.json({});
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};
apicontroller.DeleteAddWorkingHour = async (req, res) => {
  try {
    const _id = req.params.id;
    if (req.user.roleName[0] === "Admin") {
      const workingData = await workingHour.findByIdAndDelete(_id);
      res.json({ status: true });
    } else {
      res.status(403).json({ status: false, errors: "Permission denied" });
    }
  } catch (error) {
    res.status(403).send(e);
  }
};

apicontroller.editWorkingHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const workingData = await workingHour.findById(_id);
        res.json({ workingData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.updateWorkingHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const updateWorkingHourData = {
          // user_id: user_id,
          start_time: req.body.start_time,
          end_time: req.body.end_time,
          date: req.body.date,
          total_hour: req.body.total_hour,
        };
        const updatedWorkingHourData = await workingHour.findByIdAndUpdate(
          _id,
          updateWorkingHourData
        );
        // res.json({ updatedWorkingHourData });
        res.json("Working Hour Updated");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.addWorkingHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const user_id = req.user._id;

        const addWorkingHour = new workingHour({
          user_id: user_id,
          start_time: req.body.start_time,
          end_time: req.body.end_time,
          date: req.body.date,
          total_hour: req.body.total_hour,
        });
        const timeEntryadd = await addWorkingHour.save();
        res.json("time entry added");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.showWorkingHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        // const user_id = req.user._id;
        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        res.json({ userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.getWorkingHourByday = async (req, res) => {
  sess = req.session;
  const userMatch = req.body.user_id
    ? [{ user_id: new BSON.ObjectId(req.body.user_id) }]
    : [];
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  const filters = [{ date: req.body.date }, ...userMatch];
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const workingHourData = await workingHour
          .find({ $and: filters })
          .select("_id  start_time end_time total_hour");
        const breakData = [];
        if (workingHourData.length > 1) {
          for (let i = 0; i < workingHourData.length - 1; i++) {
            var start = workingHourData[i].end_time;
            var end = workingHourData[i + 1].start_time;
            var start_moment = moment(start, "HH:mm");
            var end_moment = moment(end, "HH:mm");
            var diff_moment = end_moment.diff(start_moment, "minutes");
            var diff_hours = Math.floor(diff_moment / 60);
            var diff_minutes = diff_moment % 60;

            var totalBreak =
              ("0" + diff_hours).slice(-2) +
              ":" +
              ("0" + diff_minutes).slice(-2);
            breakData.push({
              start_time: workingHourData[i].end_time,
              end_time: workingHourData[i + 1].start_time,
              break: totalBreak,
            });
          }
        }
        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        res.json({ workingHourData, breakData, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.checkHour = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const userMatch = req.body.user_id
    ? [{ user_id: new BSON.ObjectId(req.body.user_id) }]
    : [];
  const hourMatch = req.body.hour_id
    ? [{ _id: { $ne: new BSON.ObjectId(req.body.hour_id) } }]
    : [];
  const filters = [{ date: req.body.date }, ...userMatch, ...hourMatch];

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const workingHourData = await workingHour
          .find({ $and: filters })
          .select("_id start_time end_time user_id");
        res.json({ workingHourData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.addTimeEntry = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        // const user_id = req.user._id;
        const project_id = req.body.project_id;
        const task_id = req.body.task_id;
        const hours = parseFloat(req.body.hours);
        const date = req.body.date;
        const missingFields = [];
        if (!project_id) missingFields.push("Project");
        if (!task_id) missingFields.push("Task");
        if (!hours) missingFields.push("Hours");
        if (!date) missingFields.push("Date");
        // Check if any required field is missing
        if (missingFields.length > 0) {
          return res.status(400).json({
            errors: `${missingFields.join(", ")} ${missingFields.length > 1 ? "are" : "is"
              } Required`,
          });
        }
        const addTimeEntry = new timeEntry({
          user_id: user_id,
          project_id: project_id,
          task_id: task_id,
          hours: hours,
          date: date,
        });

        try {
          await addTimeEntry.save();
          res.status(201).json({ message: "Time Entry created Successfully" });
        } catch (error) {
          // console.log("errorssss",error)
          if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map(
              (err) => err.message
            );
            res.status(400).json({ errors: errorMessages.join(", ") });
          } else {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
          }
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.timeEntryListing = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View TimeEntries")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const user_id = req.body.user_id;
        const userData = await user.find({ deleted_at: "null" });
        const timeEntryData = await timeEntry.aggregate([
          {
            $lookup: {
              from: "projects",
              localField: "project_id",
              foreignField: "_id",
              as: "projectData", ///////test
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $lookup: {
              from: "tasks",
              localField: "task_id",
              foreignField: "_id",
              as: "taskData", ///////test1
            },
          },
        ]);
        res.json({ timeEntryData, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};
apicontroller.getDataBymonth = async (req, res) => {
  try {
    const _month = parseInt(req.body.month);
    const _year = parseInt(req.body.year);
    const user_id = new BSON.ObjectId(req.user._id);
    // console.log("req.body.user", req.body.user);
    const userMatch = req.body.user
      ? [{ $match: { user_id: new BSON.ObjectId(req.body.user) } }]
      : [];
    const timeEntryData = await timeEntry.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { user_id: user_id } },
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $month: "$date",
                  },
                  _month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$date",
                  },
                  _year,
                ],
              },
            ],
          },
        },
      },

      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "taskData",
        },
      },
      {
        $project: {
          "projectData.title": 1,
          "taskData.title": 1,
          date: 1,
          hours: 1,
          _id: 1,
        },
      },

      { $sort: { date: 1 } },
    ]);
    const admintimeEntryData = await timeEntry.aggregate([
      { $match: { deleted_at: "null" } },
      ...userMatch,
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $month: "$date",
                  },
                  _month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$date",
                  },
                  _year,
                ],
              },
            ],
          },
        },
      },
      { $sort: { date: 1 } },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "taskData",
        },
      },
      {
        $project: {
          "userData.firstname": 1,
          "userData._id": 1,
          "projectData.title": 1,
          "taskData.title": 1,
          date: 1,
          hours: 1,
          _id: 1,
        },
      },
    ]);

    // console.log("admintimeEntryData",admintimeEntryData)
    const userData = await user
      .find({ status: "Active", deleted_at: "null" })
      .select("firstname last_name");

    res.json({ timeEntryData, admintimeEntryData, userData });
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.getRolePermission = async (req, res) => {
  sess = req.session;

  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Roles")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;

        // const _id = req.body._id;
        const rolePermissiondata = await rolePermissions.find({ role_id: _id });
        var rolepermission = [];
        rolePermissiondata.forEach((element) => {
          rolepermission.push(element.permission_id);
        });
        // const roles = rolepermission.toString();

        const roleData = await role.findById(_id).select("_id role_name");
        // const permissions = await Permission.find({
        //   deleted_at: "null",
        // }).select("_id permission_name");
        if (rolePermissiondata.length > 0) {
          var roleHasPermission = rolePermissiondata[0].permission_id;
          res.json({ permissions, roleHasPermission, roleData });
        } else {
          roleHasPermission = [];
          res.json({ permissions, roleData, roleHasPermission });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};
apicontroller.addRolePermission = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Roles")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const id = await rolePermissions.find({ role_id: _id });

        if (id) {
          const deletepermission = await rolePermissions.findByIdAndDelete(id);

          const addpermission = new rolePermissions({
            role_id: req.body.role_id,
            permission_id: req.body.permission_id,
          });

          const permissionadd = await addpermission.save();
          res.status(201).json({ permissionadd });
        } else {
          const addpermission = new rolePermissions({
            role_id: req.body.role_id,
            permission_id: req.body.permission_id,
          });

          const permissionadd = await addpermission.save();
          res.status(201).json({ permissionadd });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((e) => {
      res.status(403).send(e);
    });
};

apicontroller.getUserPermission = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Permissions")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        sess = req.session;
        const userData = await user.findById(_id);
        const userid = userData._id;
        const userPermissiondata = await userPermissions.find({
          user_id: userid,
        });
        const rolePermissiondata = await rolePermissions.find({
          role_id: userData.role_id,
        });
        if (rolePermissiondata.length > 0) {
          var roleHasPermissions = rolePermissiondata[0].permission_id;
        }
        if (userPermissiondata.length > 0) {
          var userHasPermissions = userPermissiondata[0].permission_id;
          const allPerm = userHasPermissions.concat(roleHasPermissions);
          var existPermissions = [...new Set(allPerm)];
        } else if (rolePermissiondata.length > 0) {
          var existPermissions = roleHasPermissions;
        } else {
          var existPermissions = "";
        }
        const allPermmission = await Permission.find({
          deleted_at: "null",
        }).select("_id permission_name");
        const roledatas = await user.aggregate([
          { $match: { _id: userid } },
          {
            $lookup: {
              from: "roles",
              localField: "role_id",
              foreignField: "_id",
              as: "roleData", /////test
            },
          },
          {
            $project: {
              "roleData.role_name": 1,
              "roleData._id": 1,
              firstname: 1,
              _id: 1,
            },
          },
        ]);
        const permissionModuleData = await permissionModule.find();
        res.json({
          allPermmission,
          permissionModuleData,
          existPermissions,
          roledatas,
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.addUserPermission = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Add UserPermission")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const id = await userPermissions.find({ user_id: _id });

        const clientSideArr = req.body?.permission_id;
        const databaseArr = id[0]?.permission_id;

        const addedPermissions =
          clientSideArr && databaseArr
            ? addedPermission(clientSideArr, databaseArr)
            : "";
        const removedPermissions =
          clientSideArr && databaseArr
            ? removedPermission(clientSideArr, databaseArr)
            : "";
        let addedPermissionName =
          addedPermissions &&
          (await permission
            .findById(addedPermissions[0])
            .select("permission_name"));
        let removedPermissionsName =
          removedPermissions &&
          (await permission
            .findById(removedPermissions[0])
            .select("permission_name"));
        const userDetail = await user
          .findById(_id)
          .select("firstname last_name");

        let addPermission;
        if (id) {
          const deletepermission = await userPermissions.findByIdAndDelete(id);
          addPermission = new userPermissions({
            user_id: req.body.user_id,
            role_id: req.body.role_id,
            permission_id: req.body.permission_id,
          });
        } else {
          addPermission = new userPermissions({
            user_id: req.body.user_id,
            role_id: req.body.role_id,
            permission_id: req.body.permission_id,
          });
        }

        if (addedPermissions.length > 0 && removedPermissions.length > 0) {
          // logUserIdentity(
          //   req,
          //   `assigned the '${addedPermissionName.permission_name}' ${
          //     addedPermissions.length > 1
          //       ? "and " + (+addedPermissions.length - 1) + " other Permissions"
          //       : "Permission"
          //   },@BREAK and removed the '${
          //     removedPermissionsName.permission_name
          //   }' ${
          //     removedPermissions.length > 1
          //       ? "and " +
          //         (+removedPermissions.length - 1) +
          //         " others Permissions"
          //       : "Permission"
          //   } from ${userDetail.firstname} ${userDetail.last_name}`,
          //   req.body.user_id
          // );
        } else if (addedPermissions.length > 0) {
          // logUserIdentity(
          //   req,
          //   `assigned the '${addedPermissionName.permission_name}' ${
          //     addedPermissions.length > 1
          //       ? "and " + (+addedPermissions.length - 1) + " other Permissions"
          //       : "Permission"
          //   } to ${userDetail.firstname} ${userDetail.last_name}`,
          //   req.body.user_id
          // );
        } else if (removedPermissions.length > 0) {
          // logUserIdentity(
          //   req,
          //   `removed the '${removedPermissionsName.permission_name}' ${
          //     removedPermissions.length > 1
          //       ? "and " +
          //         (+removedPermissions.length - 1) +
          //         " others Permissions"
          //       : "Permission"
          //   } from ${userDetail.firstname} ${userDetail.last_name}`,
          //   req.body.user_id
          // );
        } else {
        }

        const Permissionadd = await addPermission.save();
        res
          .status(201)
          .json({ message: "User Permission Updated Successfully" });
      } else {
        res.status(403).json({ status: false });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.Settingslist = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Settings")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const settingData = await Settings.find({ deleted_at: "null" });
        res.json({ settingData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.leavesSettingData = async (req, res) => {
  const leavesSettingData = await Settings.find({ key: "leaves" });
  res.json({ leavesSettingData });
};
apicontroller.getAddSetting = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Setting")
    .then((rolePerm) => {
      if (rolePerm.status == true) {
        res.json({ status: true });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.Settingsadd = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Setting")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const keyExist = await Settings.find({
          key: req.body.key,
          deleted_at: "null",
        });
        if (keyExist.length > 0) {
          return res.json({ existKeyStatus: true });
        } else {
          if (req.files) {
            let file = req.files.value;
            file.mv("public/images/" + file.name);
            const addSettings = new Settings({
              key: req.body.key,
              type: req.body.type,
              value: file.name,
            });
            const Settingsadd = await addSettings.save();
            res.json("Settings add done");
          } else {
            const addSettings = new Settings({
              key: req.body.key,
              type: req.body.type,
              value: req.body.value,
            });
            const Settingsadd = await addSettings.save();
            res.json("Settings add done");
          }
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.SettingsEdit = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Setting")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const settingData = await Settings.findById(_id);
        res.json({ settingData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.SettingsUpdate = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Setting")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const existKey = await Settings.find({
          _id: { $ne: _id },
          key: req.body.key,
          deleted_at: "null",
        });
        if (existKey.length === 0) {
          if (req.files) {
            let file = req.files.value;
            file.mv("public/images/" + file.name);
            const updatedSettings = {
              key: req.body.key,
              type: req.body.type,
              value: file.name,
            };
            const updatedSetting = await Settings.findByIdAndUpdate(
              _id,
              updatedSettings
            );
            return res.json("setting updated");
          } else {
            const updatedSettings = {
              key: req.body.key,
              type: req.body.type,
              value: req.body.value,
            };
            const updatedSetting = await Settings.findByIdAndUpdate(
              _id,
              updatedSettings
            );
            logUserIdentity(
              req,
              `updated the ${req.body.key} in the setting`,
              [],
              "setting"
            );
            return res.json("setting updated");
          }
        } else {
          return res.json({ existKeyStatus: true });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.SettingsDelete = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete Setting")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const deleteSettings = {
          deleted_at: Date(),
        };
        const deletedSetting = await Settings.findByIdAndUpdate(
          _id,
          deleteSettings
        );
        res.json({ delete: deletedSetting });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.deleteTimeEntry = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "Delete TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const permissionDelete = {
          deleted_at: Date(),
        };

        await timeEntry.findByIdAndUpdate(_id, permissionDelete);
        res.json("data deleted");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.editTimeEntry = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const timeEntryData = await timeEntry
          .findById(_id)
          .select("_id project_id task_id hours date ");
        const projectData = await project
          .find({ user_id: user_id, status: "in Progress" })
          .select("_id title");
        const taskData = await task
          .find({ deleted_at: "null" })
          .select("_id title");
        const adminProjectData = await project
          .find({ status: "in Progress" })
          .select("_id title");
        const validTimeEntryDays = await Settings.findOne({
          key: "ValidTimeEntryDays",
        });
        const timeEntryRequestData = await timeEntryRequest.find({
          status: "1",
          user_id: user_id,
        });
        const validDays = validTimeEntryDays.value;
        const holidayData = await holiday
          .find({ deleted_at: "null" })
          .select("_id holiday_date");
        const userLeavesdata = await leaves
          .find({
            deleted_at: "null",
            status: "APPROVED",
            user_id: req.user._id,
          })
          .select("datefrom dateto");
        res.json({
          timeEntryData,
          projectData,
          taskData,
          adminProjectData,
          validDays,
          holidayData,
          userLeavesdata,
          timeEntryRequestData,
        });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.updateTimeEntry = async (req, res) => {
  sess = req.session;
  const _id = req.params.id;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        var today = new Date(Date.now()).toISOString().split("T")[0];
        var twoDayAgo = new Date(Date.now() - 3 * 86400000)
          .toISOString()
          .split("T")[0];
        if (req.body.date > today || req.body.date < twoDayAgo) {
          res.json({ date_status: 0, message: "Invalid date" });
        } else {
          const updateTimeEntry = {
            project_id: req.body.project_id,
            task_id: req.body.task_id,
            hours: req.body.hours,
            date: req.body.date,
          };
          const updateHolidaydata = await timeEntry.findByIdAndUpdate(
            _id,
            updateTimeEntry
          );
          res.json("data updated");
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getSettingData = async function (req, res) {
  const key = req.body.key.split(",");
  let logoArray = [];

  for (let i = 0; i < key.length; i++) {
    const settingData = await Settings.find({ key: key[i] }).select(
      "-_id value"
    );
    settingData.map((data) => {
      logoArray.push(data.value);
    });
  }
  return res.json(logoArray);
};

apicontroller.checkEmplyeeCode = async (req, res) => {
  const EMPCODE = req.body.emp_code;

  let emp_codeExist = await user.findOne({ emp_code: EMPCODE });
  if (emp_codeExist) {
    return res.status(200).json({ status: true });
  } else {
    return res.status(200).json({ status: false });
  }
};

apicontroller.filterallUserLeaves = async (req, res) => {
  try {
    var searchData = await leaveHistory.aggregate([
      {
        $match: {
          deleted_at: "null",
          year: req.body.year,
        },
      },
      {
        $lookup: {
          from: "users", // Assuming the name of the user collection is "users"
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          $or: [
            {
              "user.firstname": { $regex: req.body.searchValue, $options: "i" },
            },
            {
              "user.last_name": { $regex: req.body.searchValue, $options: "i" },
            },
          ],
        },
      },
      {
        $project: {
          "user.firstname": 1,
          "user.last_name": 1,
          total_leaves: "$total_leaves", // Assuming these fields exist in your leaveHistory collection
          taken_leaves: "$taken_leaves",
          unpaid_leaves: 1,
          year: "$year",
          remaining_leaves: "$remaining_leaves", // Adjust this based on your actual structure
        },
      },
    ]);
    res.json({ searchData });
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.alluserleaveHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    console.log(typeof req.query.year, "req.query.year");

    let searchParams = { deleted_at: "null" };

    if (req.query.year) {
      searchParams.year = req.query.year;
    }

    var leaveHistoryData = await leaveHistory.aggregate([
      { $match: searchParams },
      {
        $facet: {
          documents: [
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "userData",
              },
            },
            {
              $unwind: "$userData",
            },
            {
              $match: {
                $or: [
                  {
                    "userData.firstname": {
                      $regex: req.query.search,
                      $options: "i",
                    },
                  },
                  {
                    "userData.last_name": {
                      $regex: req.query.search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
            {
              $project: {
                "userData.firstname": 1,
                "userData.last_name": 1,
                total_leaves: "$total_leaves", // Assuming these fields exist in your leaveHistory collection
                taken_leaves: "$taken_leaves",
                unpaid_leaves: 1,
                year: "$year",
                remaining_leaves: "$remaining_leaves", // Adjust this based on your actual structure
              },
            },
            { $skip: skip },
            { $limit: limit },
          ],
          totalDocuments: [
            { $count: "count" }, // Count without skip and limit
          ],
        },
      },
    ]);

    console.log("leaveHistoryData", leaveHistoryData);

    const totalDocuments = leaveHistoryData[0].totalDocuments[0]
      ? leaveHistoryData[0].totalDocuments[0].count
      : 0;

    // console.log("timeEntryData", timeEntryData);
    const totalData = totalDocuments;
    const totalPages = Math.ceil(totalData / limit);
    const indexLeaveHistoryData = leaveHistoryData[0].documents.map(
      (item, index) => ({
        index: skip + index + 1,
        ...item,
      })
    );
    res.json({
      page,
      limit,
      totalPages,
      totalData,
      leaveHistoryData: indexLeaveHistoryData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ***************
apicontroller.Announcementslist = async (req, res) => {
  sess = req.session;
  try {
    const AnnouncementData = await Announcement.aggregate([
      { $match: { deleted_at: "null" } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          date: 1,
          "userData.firstname": 1,
          "userData.photo": 1,
        },
      },
    ]);
    const AnnouncementStatus0 = await annumncementStatus.aggregate([
      { $match: { status: "0", deleted_at: "null" } },
      { $match: { user_id: req.user._id.toString() } },
      // { $addFields: { announcement_user_id: { $toObjectId: "$announcement_user_id" } } },
      { $addFields: { announcementId: { $toObjectId: "$announcement_id" } } },
      {
        $lookup: {
          from: "users",
          localField: "announcement_user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "announcements",
          localField: "announcementId",
          foreignField: "_id",
          as: "announcementData",
        },
      },
    ]);

    const AnnouncementStatus1 = await annumncementStatus.aggregate([
      { $match: { status: "1", deleted_at: "null" } },
      { $match: { user_id: req.user._id.toString() } },
      { $addFields: { announcementId: { $toObjectId: "$announcement_id" } } },
      {
        $lookup: {
          from: "users",
          localField: "announcement_user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "announcements",
          localField: "announcementId",
          foreignField: "_id",
          as: "announcementData",
        },
      },
    ]);

    const announcementData = await Announcement.find({ deleted_at: "null" });
    res.json({
      AnnouncementData,
      announcementData,
      AnnouncementStatus0,
      AnnouncementStatus1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.Announcementsadd = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Setting")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const addAnnouncement = new Announcement({
          title: req.body.title,
          description: req.body.description,
          date: req.body.date,
          user_id: user_id,
        });
        const Announcementadd = await addAnnouncement.save({});
        const users = await user.find({ deleted_at: "null" });

        for (let i = 0; i < users.length; i++) {
          const addAnnouncementstatus = new annumncementStatus({
            announcement_id: Announcementadd._id,
            user_id: users[i]._id,
            announcement_user_id: user_id,
          });
          const Announcementstatusadd = await addAnnouncementstatus.save({});
        }
        const username = await user
          .findById(user_id)
          .select("firstname last_name");
        let userRefId = [];
        const userRef = await user
          .find({ status: "Active", deleted_at: "null" })
          .select("_id");
        const userRefLoop = userRef.map((item) => {
          userRefId.push(item._id.toString());
        });
        userRefId = userRefId.filter((value) => value !== user_id);
        logger.info({
          message: `${username.firstname} ${username.last_name} added a new Announcement`,
          user_id: user_id,
          refId: userRefId,
        });
        res.json({ "Announcement add done ": addAnnouncement });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.statusAnnouncements = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  var announcement_id = req.params.announcement_id;
  const updateAnnouncementStatus = {
    status: 1,
  };
  const announcement = await annumncementStatus.find({
    user_id: user_id,
    announcement_id: announcement_id,
  });
  const userAnnouncementStatus = announcement[0]._id;
  const updatedAnnouncement = await annumncementStatus.findByIdAndUpdate(
    userAnnouncementStatus,
    updateAnnouncementStatus
  );
  res.json("status updated");
};
apicontroller.AnnouncementsDetail = async (req, res) => {
  try {
    sess = req.session;
    const _id = new BSON.ObjectId(req.params.id);
    const AnnouncementData = await Announcement.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { _id: _id } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);
    res.json({ AnnouncementData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

apicontroller.viewAnnouncement = async (req, res) => {
  try {
    sess = req.session;
    const _id = new BSON.ObjectId(req.params.id);
    const AnnouncementData = await Announcement.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { _id: _id } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "username",
        },
      },
    ]);

    res.json({ AnnouncementData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.Announcementsdelete = async (req, res) => {
  try {
    const _id = req.params.id;
    const deleteAnnouncement = {
      deleted_at: Date(),
    };
    const deletedAnnouncement = await Announcement.findByIdAndUpdate(
      _id,
      deleteAnnouncement
    );
    res.json({ delete: deletedAnnouncement });
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.searchTimeEntry = async (req, res) => {
  try {
    const user_id = req.body.user_id;

    const timeEntryData = await timeEntry.aggregate([
      { $match: { hours: inputValue } },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "proejectData",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "taskData",
        },
      },
    ]);

    res.json({ timeEntryData });
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.searchAnnouncemnt = async (req, res) => {
  sess = req.session;
  const searchValue = req.params.searchValue;
  var searchData = await Announcement.aggregate([
    {
      $match: {
        deleted_at: "null",
        title: {
          $regex: searchValue,
          $options: "i",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userData",
      },
    },
  ]);

  if (searchData.length > 0 && searchData !== "undefined") {
    if (searchData.length == []) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      res.json({ searchData });
    }
  } else {
    var searchData = await Announcement.aggregate([
      {
        $match: {
          deleted_at: "null",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          $or: [
            { "userData.firstname": { $regex: searchValue, $options: "i" } },
          ],
        },
      },
    ]);
    if (searchData.length == []) {
      res.status(403).json({ status: false, errors: "Permission denied" });
    } else {
      res.json({ searchData });
    }
  }
};
apicontroller.Announcements = async (req, res) => {
  try {
    const user_id = req.user._id;
    var today = new Date().toISOString().split("T")[0];
    const userAnnouncement = await annumncementStatus.find({
      user_id: user_id,
      status: 0,
    });
    var announcementId = [];
    for (let i = 0; i < userAnnouncement.length; i++) {
      var announcement_id = userAnnouncement[i].announcement_id;
      announcementId.push(announcement_id);
    }
    var announcementData = await Announcement.find({
      date: { $gte: today },
      _id: announcementId,
    }).sort({ date: 1 });
    res.json({ announcementData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apicontroller.getTaskByProject = async (req, res) => {
  const project_id = new BSON.ObjectId(req.params.id);
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  const _id = new BSON.ObjectId(req.params.id);

  const roleData = await Role.findOne({ _id: role_id });
  const RoleName = roleData.role_name;
  try {
    if (RoleName == "Admin") {
      var tasks = await task
        .find({
          project_id: project_id,
          deleted_at: "null",
          task_status: 0,
        })
        .sort({ created_at: -1 });
    } else {
      var tasks = await task
        .find({
          project_id: project_id,
          deleted_at: "null",
          user_id: user_id,
          task_status: 0,
        })
        .sort({ created_at: -1 });
    }
    return res.status(200).json({ tasks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
apicontroller.deleteLeave = async (req, res) => {
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Delete Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const leaveDelete = {
          deleted_at: Date(),
        };
        const Deleteleave = await leaves.findByIdAndUpdate(_id, leaveDelete);
        const startYear = new Date(Deleteleave.datefrom).getFullYear();
        const startMonth = new Date(Deleteleave.datefrom).getMonth() + 1; // Adding 1 because months are zero-based
        let academicYear;
        if (startMonth >= 4) {
          academicYear = `${startYear}-${startYear + 1}`;
        } else {
          academicYear = `${startYear - 1}-${startYear}`;
        }
        const leaveHistoryData = await leaveHistory.findOne({
          year: academicYear,
          user_id: Deleteleave.user_id,
        });

        const userLeaves = await leaves
          .find({ deleted_at: "null", user_id: Deleteleave.user_id })
          .select("paid_leaves unpaid_leaves");

        const totalPaidLeaves = userLeaves.reduce(
          (sum, leave) => sum + leave.paid_leaves,
          0
        );
        const totalUnpaidLeaves = userLeaves.reduce(
          (sum, leave) => sum + leave.unpaid_leaves,
          0
        );
        await leaveHistory.updateOne(
          { _id: leaveHistoryData._id },
          {
            $set: {
              taken_leaves: totalPaidLeaves + totalUnpaidLeaves,
              remaining_leaves: leaveHistoryData.total_leaves - totalPaidLeaves,
              unpaid_leaves: totalUnpaidLeaves,
            },
          }
        );
        res.json("Leave deleted");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.editLeave = async (req, res) => {
  // const userId = req.body.user_id
  const userId = new BSON.ObjectId(req.params.user_id);

  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const _id = req.params.id;
        const leavesData = await leaves.findById(_id);

        const existLeaveData = await leaves
          .find({
            _id: { $ne: _id },
            user_id: userId,
            status: "APPROVED",
            deleted_at: "null",
          })
          .select("datefrom dateto");

        var existLeaveDates = [];
        existLeaveData.forEach((leaves) => {
          existLeaveDates.push({
            datefrom: leaves.datefrom,
            dateto: leaves.dateto,
          });
        });

        const holidayData = await holiday
          .find({ deleted_at: "null" })
          .select("holiday_date");

        var allHolidayDate = [];

        holidayData.forEach((holiday_date) => {
          allHolidayDate.push(holiday_date.holiday_date);
        });

        const userData = await user
          .find({ deleted_at: "null" })
          .select("firstname last_name");

        res.json({ leavesData, allHolidayDate, existLeaveDates, userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.updateLeave = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const _id = req.params.id;
  const role_id = req.user.role_id.toString();
  let paidLeavesCount = 0;
  let unpaidLeavesCount = 0;
  if (req.body.paidStatus == "UNPAID") {
    unpaidLeavesCount = req.body.totalLeaveDay;
    paidLeavesCount = 0;
  } else {
    paidLeavesCount = req.body.totalLeaveDay;
    unpaidLeavesCount = 0;
  }
  var total_days = req.body.totalLeaveDay;
  helper
    .checkPermission(role_id, user_id, "Update Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const updateLeaveData = {
          user_id: req.body.user_id,
          total_days: total_days,
          datefrom: req.body.datefrom,
          dateto: req.body.dateto,
          paid_status: req.body.paidStatus,
          reason: req.body.reason,
          is_adhoc: req.body.is_adhoc,
          half_day: req.body.half_day,
          paid_leaves: paidLeavesCount,
          unpaid_leaves: unpaidLeavesCount,
          updated_at: Date(),
        };
        await leaves.findByIdAndUpdate(_id, updateLeaveData);
        const startYear = new Date(req.body.datefrom).getFullYear();
        const startMonth = new Date(req.body.datefrom).getMonth() + 1; // Adding 1 because months are zero-based
        let academicYear;
        if (startMonth >= 4) {
          academicYear = `${startYear}-${startYear + 1}`;
        } else {
          academicYear = `${startYear - 1}-${startYear}`;
        }
        const leaveHistoryData = await leaveHistory.findOne({
          year: academicYear,
          user_id: req.body.user_id,
        });
        const userLeaves = await leaves
          .find({
            deleted_at: "null",
            status: "APPROVED",
            user_id: req.body.user_id,
          })
          .select("paid_leaves unpaid_leaves");

        const totalPaidLeaves = userLeaves.reduce(
          (sum, leave) => sum + leave.paid_leaves,
          0
        );
        const totalUnpaidLeaves = userLeaves.reduce(
          (sum, leave) => sum + leave.unpaid_leaves,
          0
        );
        await leaveHistory.updateOne(
          { _id: leaveHistoryData._id },
          {
            $set: {
              taken_leaves: totalPaidLeaves + totalUnpaidLeaves,
              remaining_leaves: leaveHistoryData.total_leaves - totalPaidLeaves,
              unpaid_leaves: totalUnpaidLeaves,
            },
          }
        );
        res.status(201).json({ message: "Leave Updated Succeessfully" });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.checkEmail = async (req, res) => {
  const Email = req.body.company_email;
  const user_id = req.body.user_id;

  const emailExists = await user.findOne({
    _id: { $ne: user_id },
    company_email: Email,
  });
  console.log("emailExists", emailExists);
  if (emailExists) {
    return res.status(200).json({ status: true });
  } else {
    return res.status(200).json({ status: false });
  }
};
// apicontroller.getDataByUser = async (req, res) => {
//   sess = req.session;
//   const user_id = req.user._id;
//   const user = req.body.userId;
//   const role_id = req.user.role_id.toString();
//   helper
//     .checkPermission(role_id, user_id, "Add leaves")
//     .then(async (rolePerm) => {
//       if (rolePerm.status == true) {
//         // const month = req.body.month;
//         // const year = req.body.year;

//         const month = parseInt(req.body.month);
//         const year = parseInt(req.body.year);
//         const userLeavesData = await leaves.find({
//           $expr: {
//             $and: [
//               {
//                 $eq: [
//                   {
//                     $month: "$dateto",
//                   },
//                   month,
//                 ],
//               },
//               {
//                 $eq: [
//                   {
//                     $year: "$dateto",
//                   },
//                   year,
//                 ],
//               },
//             ],
//           },
//           user_id: user,
//           status: "APPROVE",
//         });
//         res.json({ userLeavesData });
//       } else {
//         res.status(403).json({ status: false ,errors:'Permission denied' });
//       }
//     })
//     .catch((error) => {
//       res.status(403).send(error);
//     });
// };

apicontroller.checkUsername = async (req, res) => {
  const user_name = req.body.user_name;
  const user_id = req.body.user_id;

  const usernameExist = await user.findOne({
    _id: { $ne: user_id },
    user_name: user_name,
    deleted_at: "null",
  });

  if (usernameExist) {
    return res.status(200).json({ status: true });
  } else {
    return res.status(200).json({ status: false });
  }
};

apicontroller.checkUserHAsPermission = async (req, res) => {
  const user_id = req.params.id;
  const role_id = req.params.role_id;

  const roleData = await rolePermissions.find({ role_id: role_id });
  if (roleData.length > 0) {
    const rolepermission = roleData[0].permission_id;
    const rolePerm = await Permission.find({ _id: rolepermission });
    var rolepermissionName = [];
    for (var i = 0; i < rolePerm.length; i++) {
      rolepermissionName.push(rolePerm[i].permission_name);
    }
  }
  const userPermissiondata = await userPermissions.find({ user_id: user_id });
  if (userPermissiondata.length > 0) {
    const userpermission = userPermissiondata[0].permission_id;
    const userPerm = await Permission.find({ _id: userpermission });
    var userpermissionName = [];
    for (var i = 0; i < userPerm.length; i++) {
      userpermissionName.push(userPerm[i].permission_name);
    }
  }
  var Allpermission = [];
  if (roleData.length > 0 || userPermissiondata.length > 0) {
    const allPerm = (rolepermissionName || []).concat(userpermissionName || []);
    Allpermission = [...new Set(allPerm)];
  }

  res.json({ Allpermission });
};

apicontroller.getholidayDataBymonth = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const month = req.body.month;
        const year = req.body.year;
        // const year = new Date().getFullYear();
        // const userData = await user.find({ deleted_at: "null" });
        const holidayData = await Holiday.find({
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $month: "$holiday_date",
                  },
                  month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$holiday_date",
                  },
                  year,
                ],
              },
            ],
          },
        });
        res.json({ holidayData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.newTimeEntryData = async (req, res) => {
  const user_id = req.user._id;
  const _month = parseInt(req.body.month);
  const _year = parseInt(req.body.year);
  const users = req.body.user !== null ? new BSON.ObjectId(req.body.user) : "";
  const timeEntryData = await timeEntry.aggregate([
    { $match: { deleted_at: "null" } },
    { $match: { user_id: users } },
    {
      $match: {
        $expr: {
          $and: [
            {
              $eq: [
                {
                  $month: "$date",
                },
                _month,
              ],
            },
            {
              $eq: [
                {
                  $year: "$date",
                },
                _year,
              ],
            },
          ],
        },
      },
    },
    // { $match: { user_id: user_id } },
    {
      $lookup: {
        from: "projects",
        localField: "project_id",
        foreignField: "_id",
        as: "projectData",
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "task_id",
        foreignField: "_id",
        as: "taskData",
      },
    },
  ]);

  var timeData = [];
  timeEntryData.forEach((key) => {
    var _date = key.date.toISOString().split("T")[0].split("-").join("-");
    var _dates = new Date(_date);
    var day = _dates.getDate();

    timeData.push({
      [key.projectData[0].title]: {
        [key.taskData[0]?.title]: {
          [day]: { _day: `${day}`, h: key.hours },
        },
      },
    });
  });

  let result = {};

  for (let item of timeData) {
    let key1 = Object.keys(item)[0];
    let key2 = Object.keys(item[key1])[0];
    let value = item[key1][key2];

    if (result[key1] === undefined) {
      result[key1] = {};
    }
    if (result[key1][key2] === undefined) {
      result[key1][key2] = [value];
    } else {
      result[key1][key2].push(value);
    }
  }
  let mergedData = [result];
  res.json({ timeEntryData: mergedData });
};

// apicontroller.sendmail = async (req, res) => {
// };
apicontroller.activeuserAccount = async (req, res) => {
  try {
    const userData = await user.findById(req.params.id);
    if (!(userData.status == "Active")) {
      const _id = req.params.id;
      const password = req.body.password;
      const cpassword = req.body.cpassword;

      const users = await user.findById(req.params.id);
      if (!(password == cpassword)) {
        res.staus(400).json({ message: "please check confirm password" });
      } else {
        const passswords = await bcrypt.hash(req.body.password, 10);
        const updatepassword = {
          password: passswords,
          status: "Active",
        };
        const updatPssword = await user.findByIdAndUpdate(_id, updatepassword);
        res.status(200).json({
          message: "Account is activated",
        });
      }
    } else {
      res.status(400).json({
        message: "Your account is already activated",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

apicontroller.getHolidaybymonth = async (req, res) => {
  try {
    const _month = parseInt(req.body.month);
    const _year = parseInt(req.body.year);
    const user = new BSON.ObjectId(req.body.user);

    const Holidaybymonth = await holiday
      .find({
        $expr: {
          $and: [
            {
              $eq: [
                {
                  $month: "$holiday_date",
                },
                _month,
              ],
            },
            {
              $eq: [
                {
                  $year: "$holiday_date",
                },
                _year,
              ],
            },
          ],
        },
        deleted_at: "null",
      })
      .select("_id holiday_date");
    res.json({ Holidaybymonth });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.getLeavebymonth = async (req, res) => {
  try {
    const _month = parseInt(req.body.month);
    const _year = parseInt(req.body.year);
    const users = new BSON.ObjectId(req.body.user);
    const Leavebymonth = await leaves
      .find({
        $expr: {
          $and: [
            {
              $and: [
                {
                  $eq: [
                    {
                      $month: "$datefrom",
                    },
                    _month,
                  ],
                },
                {
                  $eq: [
                    {
                      $year: "$datefrom",
                    },
                    _year,
                  ],
                },
              ],
            },
            {
              $and: [
                {
                  $eq: [
                    {
                      $month: "$dateto",
                    },
                    _month,
                  ],
                },
                {
                  $eq: [
                    {
                      $year: "$dateto",
                    },
                    _year,
                  ],
                },
              ],
            },
          ],
        },
        user_id: users,
        deleted_at: "null",
        half_day: "",
      })
      .select("_id datefrom dateto");
    res.json({ Leavebymonth });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.getAddSalary = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add SalaryStructure")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const userData = await user
          .find({ deleted_at: "null" })
          .select("_id firstname last_name");
        res.json({ userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.addSalaryStructure = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add SalaryStructure")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const salaryStructure = new salarustructure({
          user_id: req.body.user_id,
          Basic_Salary: req.body.Basic_Salary,
          House_Rent_Allow: req.body.House_Rent_Allow,
          Other_Allownces: req.body.Other_Allownces,
          Performance_Allownces: req.body.Performance_Allownces,
          Bonus: req.body.Bonus,
          Other: req.body.Other,
          EL_Encash_Amount: req.body.EL_Encash_Amount,
          Professional_Tax: req.body.Professional_Tax,
          Income_Tax: req.body.Income_Tax,
          Gratuity: req.body.Gratuity,
          Provident_Fund: req.body.Provident_Fund,
          ESIC: req.body.ESIC,
          Other_Deduction: req.body.Other_Deduction,
          Total_Salary: req.body.Total_Salary,
          Gross_Salary: req.body.Gross_Salary,
          Total_Deduction: req.body.Total_Deduction,
          Net_Salary: req.body.Net_Salary,
          year: req.body.year,
        });
        const salarystructureadd = await salaryStructure.save();
        res.json("structure inserted");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.updateSalaryStructure = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const _id = req.params.id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Update SalaryStructure")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const updatedsalaryStructureData = {
          user_id: req.body.user_id,
          Basic_Salary: req.body.Basic_Salary,
          House_Rent_Allow: req.body.House_Rent_Allow,
          Other_Allownces: req.body.Other_Allownces,
          Performance_Allownces: req.body.Performance_Allownces,
          Bonus: req.body.Bonus,
          Other: req.body.Other,
          EL_Encash_Amount: req.body.EL_Encash_Amount,
          Professional_Tax: req.body.Professional_Tax,
          Income_Tax: req.body.Income_Tax,
          Gratuity: req.body.Gratuity,
          Provident_Fund: req.body.Provident_Fund,
          ESIC: req.body.ESIC,
          Total_Salary: req.body.Total_Salary,
          Gross_Salary: req.body.Gross_Salary,
          Total_Deduction: req.body.Total_Deduction,
          Net_Salary: req.body.Net_Salary,
          Other_Deduction: req.body.Other_Deduction,
          year: req.body.year,
        };

        const salarystructureadd = await salarustructure.findByIdAndUpdate(
          _id,
          updatedsalaryStructureData
        );

        res.json("structure Updated");
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getDataByUser = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const user = new BSON.ObjectId(req.body.user);
  const _month = parseInt(req.body.month);
  const _year = parseInt(req.body.year);
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const userLeavesData = await leaves.find({
          $expr: {
            $and: [
              {
                $or: [
                  {
                    $eq: [
                      {
                        $month: "$datefrom",
                      },
                      _month,
                    ],
                  },
                  {
                    $eq: [
                      {
                        $year: "$datefrom",
                      },
                      _year,
                    ],
                  },
                ],
              },
              {
                $or: [
                  {
                    $eq: [
                      {
                        $month: "$dateto",
                      },
                      _month,
                    ],
                  },
                  {
                    $eq: [
                      {
                        $year: "$dateto",
                      },
                      _year,
                    ],
                  },
                ],
              },
            ],
          },
          user_id: user,
          status: "APPROVED",
        });

        res.json({ userLeavesData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.getWorkingDay = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const user = new BSON.ObjectId(req.body.user);
  const _month = parseInt(req.body.month);
  const _year = parseInt(req.body.year);
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const holidayData = await Holiday.find({
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $month: "$holiday_date",
                  },
                  _month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$holiday_date",
                  },
                  _year,
                ],
              },
            ],
          },
        });

        res.json({ holidayData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.getLeaveBalance = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const user = new BSON.ObjectId(req.body.user);

  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Role")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const LeavesData = await leaves.find({
          user_id: user,
          status: "APPROVED",
        });
        let totalTakenLeaves = 0;
        for (let i = 0; i < LeavesData.length; i++) {
          const startDate = new Date(LeavesData[i].datefrom);
          const endDate = new Date(LeavesData[i].dateto);
          const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
          totalTakenLeaves += diffDays;
        }

        // days.push({ takenLeaves });
        res.json({ totalTakenLeaves });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.salaryListing = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;

  const role_id = req.user.role_id.toString();

  helper
    .checkPermission(role_id, user_id, "View Salary")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const userHasSalaryStructure = await salarustructure.find();
        var salarustructureUsers = [];
        userHasSalaryStructure.forEach((users) => {
          salarustructureUsers.push(users.user_id);
        });

        const adminSalaryData = await user
          .find({
            deleted_at: "null",
            _id: salarustructureUsers,
          })
          .select("_id firstname last_name");

        const userSalaryData = await user
          .find({
            deleted_at: "null",
            _id: req.user._id,
          })
          .select("_id firstname last_name");
        // const salaryData = await salary.aggregate([
        //   {
        //     $lookup: {
        //       from: "users",
        //       localField: "user_id",
        //       foreignField: "_id",
        //       as: "userData",
        //     },
        //   },
        // ]);
        res.json({ adminSalaryData, userSalaryData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.salaryParticularList = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Settings")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const salaryparticularData = await salay_particulars.find();
        res.json({ salaryparticularData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.salaryStructureListing = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View SalaryStructures")
    .then(async (rolePerm) => {
      if (rolePerm.status === true) {
        const salaryStructureData = await salarustructure.aggregate([
          { $addFields: { userId: { $toObjectId: "$user_id" } } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $project: {
              "userData.firstname": 1,
              "userData.last_name": 1,
              "userData._id": 1,
              Basic_Salary: 1,
              House_Rent_Allow: 1,
              Other_Allownces: 1,
              Performance_Allownces: 1,
              Bonus: 1,
              Other: 1,
              EL_Encash_Amount: 1,
              Professional_Tax: 1,
              Income_Tax: 1,
              Gratuity: 1,
              Provident_Fund: 1,
              ESIC: 1,
              Other_Deduction: 1,
              Total_Salary: 1,
              Gross_Salary: 1,
              Total_Deduction: 1,
              Net_Salary: 1,
              status: 1,
              year: 1,
            },
          },
        ]);
        res.json({ salaryStructureData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.getUserData = async (req, res) => {
  const user_id = new BSON.ObjectId(req.body.user);
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Settings")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const pipeline = [
          {
            $match: {
              _id: user_id,
            },
          },
          { $addFields: { roleId: { $toObjectId: "$role_id" } } },
          {
            $lookup: {
              from: "roles",
              localField: "roleId",
              foreignField: "_id",
              as: "roleData",
            },
          },
          {
            $project: {
              "roleData.role_name": 1,
              firstname: 1,
              emp_code: 1,
              doj: 1,
              pan_number: 1,
              bank_name: 1,
              bank_account_no: 1,
              _id: 1, // Exclude the _id field if you don't need it
            },
          },
          {
            $addFields: {
              roleName: "$roleData.role_name",
            },
          },
        ];
        var UserData = await user.aggregate(pipeline);
        const userData = UserData[0];
        res.json({ userData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.getUSerSalaryStructure = async (req, res) => {
  sess = req.session;
  const user_id = req.body.user;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "View Settings")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const salaryStructureData = await salarustructure.find({
          user_id: user_id,
        });
        res.json({ salaryStructureData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.editSalaryStructure = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  const structureId = req.params.id;
  helper
    .checkPermission(role_id, user_id, "Update SalaryStructure")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const salaryStructureData = await salarustructure.findOne({
          _id: structureId,
        });
        const userId = salaryStructureData.user_id;
        const userData = await user.find();
        const existuserData = await user.findOne({ _id: userId });
        res.json({ userData, salaryStructureData, existuserData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.genrateSalarySlip = async (req, res) => {
  try {
    // const structureId = req.params.id;
    // if (rolePerm.status == true) {
    const this_month = parseInt(req.params.month);
    const this_year = parseInt(req.params.year);
    const userId = new BSON.ObjectId(req.params.id);
    const daysInMonth = getDaysInMonth(this_year, this_month);
    const sundaysInMonth = getSundaysInMonth(this_year, this_month);
    const holidayData = await Holiday.find({
      $expr: {
        $and: [
          {
            $eq: [
              {
                $month: "$holiday_date",
              },
              this_month,
            ],
          },
          {
            $eq: [
              {
                $year: "$holiday_date",
              },
              this_year,
            ],
          },
        ],
      },
    });
    const holidaysInMonth = holidayData.length;
    const WorkinDayOfTheMonth = daysInMonth - sundaysInMonth - holidaysInMonth;
    const SettingLeaveData = await Settings.findOne({ key: "leaves" });
    const userLeavesData = await leaves.find({
      $expr: {
        $and: [
          {
            $or: [
              {
                $eq: [
                  {
                    $month: "$datefrom",
                  },
                  this_month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$datefrom",
                  },
                  this_year,
                ],
              },
            ],
          },
          {
            $or: [
              {
                $eq: [
                  {
                    $month: "$dateto",
                  },
                  this_month,
                ],
              },
              {
                $eq: [
                  {
                    $year: "$dateto",
                  },
                  this_year,
                ],
              },
            ],
          },
        ],
      },
      user_id: userId,
      status: "APPROVED",
    });
    let leave = 0;
    var totaldate = [];
    userLeavesData.forEach(function (val) {
      const DF = new Date(val.datefrom);
      const DT = new Date(val.dateto);
      var days_difference = 0;
      for (let d = DF; d <= DT; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === this_month) {
          days_difference += 1;
        }
      }
      if (days_difference > 0) {
        totaldate.push(days_difference);
      }
    });
    totaldate.forEach((item) => {
      leave += item;
    });
    const absentDaysInMonth = leave;
    const presentDaysInMonth = WorkinDayOfTheMonth - leave;
    function getSundaysInMonth(year, month) {
      const date = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0).getDate();
      let count = 0;
      for (let i = 1; i <= lastDay; i++) {
        date.setDate(i);
        if (date.getDay() === 0) {
          count++;
        }
      }
      return count;
    }
    function getDaysInMonth(year, month) {
      return new Date(year, month, 0).getDate();
    }
    const pipeline = [
      {
        $match: {
          _id: userId,
        },
      },
      { $addFields: { roleId: { $toObjectId: "$role_id" } } },
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $addFields: {
          roleName: "$role.role_name",
        },
      },
    ];
    const userData = await user.aggregate(pipeline);
    const UserData = userData[0];
    const SettingAddressData = await Settings.findOne({ key: "address" });
    const SalaryStructureData = await salarustructure.findOne({
      user_id: userId,
    });
    var Balance_cf = await salary_genrated.findOne({
      month: this_month - 1,
      user_id: userId,
    });
    if (Balance_cf == null) {
      var leave_balance = SettingLeaveData.value;
    } else {
      var salary_data = await salary_genrated.findOne({
        month: this_month - 1,
        user_id: userId,
      });
      var leave_balance = salary_data.leave_balance_cf;
    }
    var balanceCF = leave_balance - absentDaysInMonth;
    if (balanceCF < 0) {
      var LeaveWithoutPay = balanceCF;
    } else {
      var balanceCF = balanceCF;
    }

    // const leave_balance_cf =

    // var Balance_cf = await salary_genrated.findOne({
    //   month: this_month - 1,
    //   user_id: userId,
    // });
    if (Balance_cf == null) {
      var leave_balance_cf = SettingLeaveData.value - absentDaysInMonth;
    } else {
      var salary_data = await salary_genrated.findOne({
        month: this_month - 1,
        user_id: userId,
      });
      var leave_balance_cf = salary_data.leave_balance_cf - absentDaysInMonth;
      if (leave_balance_cf < 0) {
        var balance_cf = 0;
      } else {
        var balance_cf = salary_data.leave_balance_cf - absentDaysInMonth;
      }
    }
    const templatePath = path.join(
      __dirname,
      "../../../src/views/partials/salary_slip.ejs"
    );
    const template = fs.readFileSync(templatePath, "utf8");
    const html = ejs.render(template, {
      salary: SalaryStructureData ? SalaryStructureData : "no data found",
      user: UserData,
      month: this_month,
      year: this_year,
      LeaveWithoutPay: LeaveWithoutPay,
      balanceCF: balanceCF,
      leave_balance: leave_balance,
      absentDaysInMonth: absentDaysInMonth,
      settingLeaves: SettingLeaveData,
      settingAddress: SettingAddressData,
      daysInMonth: daysInMonth,
      WorkinDayOfTheMonth: WorkinDayOfTheMonth,
      presentDaysInMonth: presentDaysInMonth,
      absentDaysInMonth: absentDaysInMonth,
    });

    // // const timestamp = new Date().getTime();
    // // const downloadPath = path.join(
    // //   os.homedir(),
    // //   "Downloads",
    // //   `salary_slip-pdf-${UserData.firstname}-${timestamp}.pdf`
    // // );
    // const options = {
    //   format: "Letter", // paper size
    //   orientation: "portrait", // portrait or landscape
    //   border: "10mm", // page border size
    // };
    // // Generate the PDF file from HTML and save it to disk
    pdf.create(html, {}).toBuffer((err, buffer) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error generating PDF file");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=salary_slip.pdf`
      );
      res.status(201).send(buffer);
    });
    // Send the file data in chunks to the client for download

    // const Salary_slip_genrated = new salary_genrated({
    //   user_id: userId,
    //   month: this_month,
    //   year: this_year,
    //   Basic_Salary: SalaryStructureData.Basic_Salary,
    //   House_Rent_Allow: SalaryStructureData.House_Rent_Allow,
    //   Other_Allownces: SalaryStructureData.Other_Allownces,
    //   Performance_Allownces: SalaryStructureData.Performance_Allownces,
    //   Bonus: SalaryStructureData.Bonus,
    //   Other: SalaryStructureData.Other,
    //   EL_Encash_Amount: SalaryStructureData.EL_Encash_Amount,
    //   Professional_Tax: SalaryStructureData.Professional_Tax,
    //   Income_Tax: SalaryStructureData.Income_Tax,
    //   Gratuity: SalaryStructureData.Gratuity,
    //   Provident_Fund: SalaryStructureData.Provident_Fund,
    //   ESIC: SalaryStructureData.ESIC,
    //   Other_Deduction: SalaryStructureData.Other_Deduction,
    //   leave_balance_cf: balance_cf,
    //   file_path: "D:projectsEMS1",
    // });

    // const salarystructureadd = await Salary_slip_genrated.save();
    // res.json(downloadPath);
    // res.redirect("/salaryListing");
    // });
    // } else {
    //   res.status(403).json({ status: false ,errors:'Permission denied' });
    // }

    //   });
  } catch (error) {
    console.log(error, "----Error----");
    res.json({ message: error.message });
  }
};
apicontroller.sendSalarySlip = async (req, res) => {
  // const structureId = req.params.id;
  // if (rolePerm.status == true) {
  const this_month = parseInt(req.params.month);
  const this_year = parseInt(req.params.year);
  const userId = new BSON.ObjectId(req.params.id);
  const daysInMonth = getDaysInMonth(this_year, this_month);
  const sundaysInMonth = getSundaysInMonth(this_year, this_month);
  const holidayData = await Holiday.find({
    $expr: {
      $and: [
        {
          $eq: [
            {
              $month: "$holiday_date",
            },
            this_month,
          ],
        },
        {
          $eq: [
            {
              $year: "$holiday_date",
            },
            this_year,
          ],
        },
      ],
    },
  });
  const holidaysInMonth = holidayData.length;
  const WorkinDayOfTheMonth = daysInMonth - sundaysInMonth - holidaysInMonth;
  const SettingLeaveData = await Settings.findOne({ key: "leaves" });
  const userLeavesData = await leaves.find({
    $expr: {
      $and: [
        {
          $or: [
            {
              $eq: [
                {
                  $month: "$datefrom",
                },
                this_month,
              ],
            },
            {
              $eq: [
                {
                  $year: "$datefrom",
                },
                this_year,
              ],
            },
          ],
        },
        {
          $or: [
            {
              $eq: [
                {
                  $month: "$dateto",
                },
                this_month,
              ],
            },
            {
              $eq: [
                {
                  $year: "$dateto",
                },
                this_year,
              ],
            },
          ],
        },
      ],
    },
    user_id: userId,
    status: "APPROVED",
  });
  let leave = 0;
  var totaldate = [];
  userLeavesData.forEach(function (val) {
    const DF = new Date(val.datefrom);
    const DT = new Date(val.dateto);
    var days_difference = 0;
    for (let d = DF; d <= DT; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() + 1 === this_month) {
        days_difference += 1;
      }
    }
    if (days_difference > 0) {
      totaldate.push(days_difference);
    }
  });
  totaldate.forEach((item) => {
    leave += item;
  });
  const absentDaysInMonth = leave;
  const presentDaysInMonth = WorkinDayOfTheMonth - leave;
  function getSundaysInMonth(year, month) {
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    let count = 0;
    for (let i = 1; i <= lastDay; i++) {
      date.setDate(i);
      if (date.getDay() === 0) {
        count++;
      }
    }
    return count;
  }
  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }
  const pipeline = [
    {
      $match: {
        _id: userId,
      },
    },
    { $addFields: { roleId: { $toObjectId: "$role_id" } } },
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $addFields: {
        roleName: "$role.role_name",
      },
    },
  ];
  const userData = await user.aggregate(pipeline);
  const UserData = userData[0];
  const SettingAddressData = await Settings.findOne({ key: "address" });
  const SalaryStructureData = await salarustructure.findOne({
    user_id: userId,
  });
  var Balance_cf = await salary_genrated.findOne({
    month: this_month - 1,
    user_id: userId,
  });
  if (Balance_cf == null) {
    var leave_balance = SettingLeaveData.value;
  } else {
    var salary_data = await salary_genrated.findOne({
      month: this_month - 1,
      user_id: userId,
    });
    var leave_balance = salary_data.leave_balance_cf;
  }
  var balanceCF = leave_balance - absentDaysInMonth;
  if (balanceCF < 0) {
    var LeaveWithoutPay = balanceCF;
  } else {
    var balanceCF = balanceCF;
  }

  // const leave_balance_cf =

  // var Balance_cf = await salary_genrated.findOne({
  //   month: this_month - 1,
  //   user_id: userId,
  // });
  if (Balance_cf == null) {
    var leave_balance_cf = SettingLeaveData.value - absentDaysInMonth;
  } else {
    var salary_data = await salary_genrated.findOne({
      month: this_month - 1,
      user_id: userId,
    });
    var leave_balance_cf = salary_data.leave_balance_cf - absentDaysInMonth;
    if (leave_balance_cf < 0) {
      var balance_cf = 0;
    } else {
      var balance_cf = salary_data.leave_balance_cf - absentDaysInMonth;
    }
  }

  // res.json({ salary: SalaryStructureData ,
  //           user: UserData,
  //           month: this_month,
  //           year: this_year,
  //           LeaveWithoutPay: LeaveWithoutPay,
  //           balanceCF: balanceCF,
  //           leave_balance: leave_balance,
  //           absentDaysInMonth: absentDaysInMonth,
  //           settingLeaves: SettingLeaveData,
  //           settingAddress: SettingAddressData,
  //           daysInMonth: daysInMonth,
  //           WorkinDayOfTheMonth: WorkinDayOfTheMonth,
  //           presentDaysInMonth: presentDaysInMonth,
  //           absentDaysInMonth: absentDaysInMonth,})
  // const path = require("path");
  // // const static_path = path.join(__dirname, "/public");
  // // const view_path = path.join(__dirname, "/src/views");
  const templatePath = path.join(
    __dirname,
    "../../../src/views/partials/salary_slip.ejs"
  );

  const template = fs.readFileSync(templatePath, "utf8");

  const html = ejs.render(template, {
    salary: SalaryStructureData ? SalaryStructureData : "no data found",
    user: UserData,
    month: this_month,
    year: this_year,
    LeaveWithoutPay: LeaveWithoutPay,
    balanceCF: balanceCF,
    leave_balance: leave_balance,
    absentDaysInMonth: absentDaysInMonth,
    settingLeaves: SettingLeaveData,
    settingAddress: SettingAddressData,
    daysInMonth: daysInMonth,
    WorkinDayOfTheMonth: WorkinDayOfTheMonth,
    presentDaysInMonth: presentDaysInMonth,
    absentDaysInMonth: absentDaysInMonth,
  });
  // // const timestamp = new Date().getTime();
  // // const downloadPath = path.join(
  // //   os.homedir(),
  // //   "Downloads",
  // //   `salary_slip-pdf-${UserData.firstname}-${timestamp}.pdf`
  // // );
  const options = {
    format: "Letter", // paper size
    orientation: "portrait", // portrait or landscape
    border: "10mm", // page border size
  };
  // // Generate the PDF file from HTML and save it to disk
  pdf.create(html, options).toBuffer(async (err, buffer) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error generating PDF file");
    }
    // Send the PDF buffer to the client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=salary_slip.pdf`
    );
    // Send the PDF as an attachment via email
    await sendSalarySlip(UserData.company_email, buffer);
    // res.send(buffer);
    res.json({ email_status: true, message: "PDF Send" });
  });

  // Send the file data in chunks to the client for download

  // const Salary_slip_genrated = new salary_genrated({
  //   user_id: userId,
  //   month: this_month,
  //   year: this_year,
  //   Basic_Salary: SalaryStructureData.Basic_Salary,
  //   House_Rent_Allow: SalaryStructureData.House_Rent_Allow,
  //   Other_Allownces: SalaryStructureData.Other_Allownces,
  //   Performance_Allownces: SalaryStructureData.Performance_Allownces,
  //   Bonus: SalaryStructureData.Bonus,
  //   Other: SalaryStructureData.Other,
  //   EL_Encash_Amount: SalaryStructureData.EL_Encash_Amount,
  //   Professional_Tax: SalaryStructureData.Professional_Tax,
  //   Income_Tax: SalaryStructureData.Income_Tax,
  //   Gratuity: SalaryStructureData.Gratuity,
  //   Provident_Fund: SalaryStructureData.Provident_Fund,
  //   ESIC: SalaryStructureData.ESIC,
  //   Other_Deduction: SalaryStructureData.Other_Deduction,
  //   leave_balance_cf: balance_cf,
  //   file_path: "D:projectsEMS1",
  // });

  // const salarystructureadd = await Salary_slip_genrated.save();
  // res.json(downloadPath);
  // res.redirect("/salaryListing");
  // });
  // } else {
  //   res.status(403).json({ status: false ,errors:'Permission denied' });
  // }

  //   });
};

apicontroller.NewUserEmployeeCode = async (req, res) => {
  try {
    const userData = await user.find({ deleted_at: "null" });

    if (userData.length === 0) {
      // Handle the case where userData is empty
      // You can return a default value or an error message
      res.status(404).json({ error: "No user data found." });
      return;
    }

    let maxEmpCode = userData.reduce(function (prev, curr) {
      return prev.emp_code > curr.emp_code ? prev : curr;
    });
    let newNum = parseInt(maxEmpCode.emp_code.substr(3)) + 1;

    // Combine the "CC-" prefix with the new numeric value
    let newEmpCode = "CC-" + newNum.toString().padStart(4, "0");
    res.json({ newEmpCode: newEmpCode });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user data." });
  }
};

apicontroller.filterProjectData = async (req, res) => {
  try {
    const userMatch = req.body.user_id
      ? [{ $match: { user_id: new BSON.ObjectId(req.body.user_id) } }]
      : [];
    const statusMatch = req.body.status
      ? [{ $match: { status: req.body.status } }]
      : [];
    //  const projectID = new BSON.ObjectId(req.body.project_id);
    const adminProjectData = await project.aggregate([
      { $match: { deleted_at: "null" } },
      ...statusMatch,
      ...userMatch,
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);
    res.json({ adminProjectData });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.filterTaskData = async (req, res) => {
  try {
    const userMatch = req.body.user_id
      ? [{ $match: { user_id: new BSON.ObjectId(req.body.user_id) } }]
      : [];
    const statusMatch = req.body.status.toString()
      ? [{ $match: { task_status: req.body.status } }]
      : [];
    const projectMatch = req.body.project_id
      ? [{ $match: { project_id: new BSON.ObjectId(req.body.project_id) } }]
      : [];
    // const Status = (req.body.status)?.toString();

    const adminTaskdata = await task.aggregate([
      { $match: { deleted_at: "null" } },
      ...statusMatch,
      ...projectMatch,
      ...userMatch,
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData", //test
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData", //test1
        },
      },
      {
        $lookup: {
          from: "timeentries",
          localField: "_id",
          foreignField: "task_id",
          as: "timeEntryData",
        },
      },
      {
        $project: {
          "projectData.title": 1,
          "userData.firstname": 1,
          "userData._id": 1,
          "userData.last_name": 1,
          title: 1,
          task_status: 1,
          task_type: 1,
          short_description: 1,
          task_estimation: 1,
          _id: 1,
          totalHours: {
            $reduce: {
              input: {
                $map: {
                  input: "$timeEntryData",
                  as: "hour",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$$hour.hours", ""] },
                          { $gte: [{ $toDouble: "$$hour.hours" }, 0] },
                        ],
                      },
                      then: { $toDouble: "$$hour.hours" },
                      else: 0,
                    },
                  },
                },
              },
              initialValue: 0,
              in: { $add: ["$$value", "$$this"] },
            },
          },
          estimatedHours: { $toDouble: "$task_estimation" },
        },
      },
      {
        $addFields: {
          productivityFactor: {
            $cond: {
              if: {
                $eq: ["$estimatedHours", 0], // Check if estimatedHours is zero
              },
              then: 0, // Set productivityFactor to 0 if estimatedHours is zero
              else: {
                $cond: {
                  if: {
                    $gte: [
                      {
                        $round: [
                          {
                            $divide: ["$totalHours", "$estimatedHours"],
                          },
                          2,
                        ],
                      },
                      100,
                    ],
                  },
                  then: 100,
                  else: {
                    $round: [
                      {
                        $divide: ["$totalHours", "$estimatedHours"],
                      },
                      2,
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ]);
    res.json({ adminTaskdata });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
};

apicontroller.getTaskByUser = async (req, res) => {
  try {
    const userId = new BSON.ObjectId(req.body.user_id);
    const adminTaskdata = await task.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData", //test
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData", //test1
        },
      },
    ]);
    res.json({ adminTaskdata });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.getTaskDataByProject = async (req, res) => {
  try {
    const projectId = new BSON.ObjectId(req.body.project_id);
    const adminTaskdata = await task.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { project_id: projectId } },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "projectData", //test
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData", //test1
        },
      },
    ]);
    res.json({ adminTaskdata });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.getProjectByUser = async (req, res) => {
  try {
    const userId = new BSON.ObjectId(req.body.user_id);
    const adminProjectData = await project.aggregate([
      { $match: { deleted_at: "null" } },
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);
    res.json({ adminProjectData });
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.filterLeaveData = async (req, res) => {
  try {
    const user_id = req.user._id;
    const search = req.query.search;
    const userMatch = req.body.user_id
      ? [{ $match: { user_id: new BSON.ObjectId(req.body.user_id) } }]
      : [];
    const statusMatch = req.body.status
      ? [{ $match: { status: req.body.status } }]
      : [];
    const searchQuery = req.query.search
      ? [
        {
          $match: {
            $or: [
              {
                "userData.firstname": {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                reason: {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        },
      ]
      : null;
    const yearMatch = req.body.year
      ? [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    "$datefrom",
                    new Date(parseInt(req.body.year.split("-")[0]), 3, 1),
                  ],
                },
                {
                  $lte: [
                    "$dateto",
                    new Date(parseInt(req.body.year.split("-")[1]), 2, 31),
                  ],
                },
              ],
            },
          },
        },
      ]
      : [];
    const monthMatch = req.body.month
      ? [
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $month: "$datefrom",
                },
                req.body.month,
              ],
            },
          },
        },
      ]
      : [];
    const combinedMatch = userMatch.concat(yearMatch, monthMatch);

    const adminLeavesrequestData = await leaves.aggregate([
      {
        $match: {
          deleted_at: "null",
          status: { $ne: "CANCELLED" },
        },
      },
      ...combinedMatch,
      ...statusMatch,
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      ...(searchQuery || []),
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "PENDING"] }, then: 1 },
                { case: { $eq: ["$status", "APPROVED"] }, then: 2 },
                { case: { $eq: ["$status", "REJECTED"] }, then: 3 },
                // Add more branches if needed for other status values
              ],
              default: 4, // Default value for any other status not covered
            },
          },
        },
      },
      { $sort: { statusOrder: 1, datefrom: -1 } },
    ]);

    const ReportingUserData = await user.find({ reporting_user_id: user_id });

    const isReportingUser = ReportingUserData.length > 0;

    var reportingUsers = [];
    for (let i = 0; i < ReportingUserData.length; i++) {
      const reportingUser = ReportingUserData[i]._id;
      reportingUsers.push(reportingUser);
    }
    const reportingUserLeavesRequestData = await leaves.aggregate([
      {
        $match: {
          deleted_at: "null",
          status: { $ne: "CANCELLED" },
        },
      },
      { $match: { user_id: { $in: reportingUsers } } },
      ...combinedMatch,
      ...statusMatch,
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      ...(searchQuery || []),
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "PENDING"] }, then: 1 },
                { case: { $eq: ["$status", "APPROVED"] }, then: 2 },
                { case: { $eq: ["$status", "REJECTED"] }, then: 3 },
                // Add more branches if needed for other status values
              ],
              default: 4, // Default value for any other status not covered
            },
          },
        },
      },
      { $sort: { statusOrder: 1, datefrom: -1 } },
    ]);
    const userData = await user
      .find({ deleted_at: "null" })
      .select("_id firstname last_name");
    res.json({
      adminLeavesrequestData,
      userData,
      isReportingUser,
      reportingUserLeavesRequestData,
    });
  } catch (e) {
    console.log(e.message, "Error");
    res.status(400).send(e.message);
  }
};
apicontroller.updateLeaveStatus = async (req, res) => {
  await leaves.updateMany({ status: "PENDING" });
  res.json({ message: "Done" });
};
apicontroller.timeEntryRequest = async (req, res) => {
  try {
    var threeDayAgo = new Date(Date.now() - 3 * 86400000)
      .toISOString()
      .split("T")[0];
    if (req.body.start_date > threeDayAgo || req.body.end_date > threeDayAgo) {
      res.json({ date_status: 0, message: "invalid date" });
    } else {
      const addTimeEntryRequest = new timeEntryRequest({
        user_id: req.user._id,
        approver_id: "",
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        reason: req.body.reason,
      });
      var usreData = await user.findById(req.user._id);
      var reportingData = await user.findById(req.user.reporting_user_id);
      var link = `${process.env.BASE_URL}/timeEntryRequestListing/`;
      var datefrom = req.body.start_date;
      var dateto = req.body.end_date;
      var dateparts = datefrom.split("-");
      var DateFrom = dateparts[2] + "-" + dateparts[1] + "-" + dateparts[0];

      var datetoparts = dateto.split("-");
      var DateTo = datetoparts[2] + "-" + datetoparts[1] + "-" + datetoparts[0];
      // const leavesadd = await addLeaves.save();
      await sendtimeEntryRequestEmail(
        usreData.firstname,
        DateFrom,
        DateTo,
        reportingData.firstname,
        reportingData.company_email,
        link
      );
      const requestAdd = await addTimeEntryRequest.save();
      res.json("Time Entry request Added");
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.timeEntryRequestListing = async (req, res) => {
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add Leaves")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const timeEntryRequestData = await timeEntryRequest.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userData",
            },
          },
        ]);
        const userTimeEntryRequestData = await timeEntryRequest.find({
          user_id: user_id,
        });

        // const  = await timeEntryRequest.find({});
        res.json({ timeEntryRequestData, userTimeEntryRequestData });
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.approveTimeEntryRequest = async (req, res) => {
  try {
    const user_id = req.user._id;
    const role_id = req.user.role_id.toString();
    helper
      .checkPermission(role_id, user_id, "Accept Or Reject TimeEntryRequest")
      .then(async (rolePerm) => {
        if (rolePerm.status == true) {
          const _id = req.params.id;
          const approveRequestData = {
            status: "1",
            approver_id: req.user._id,
          };
          const timeEntryApproved = await timeEntryRequest.findByIdAndUpdate(
            _id,
            approveRequestData
          );

          var link = `${process.env.BASE_URL}/employeeLeavesList/`;
          const usreData = await user.findById(timeEntryApproved.user_id);
          var reportingData = await user.findById(req.user._id);
          var datefrom = timeEntryApproved.start_date;
          var dateto = timeEntryApproved.end_date;
          var status = timeEntryApproved.status;
          const df = new Date(datefrom);
          const DateFrom = `${df.getDate().toString().padStart(2, "0")}-${(
            df.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}-${df.getFullYear()}`;

          const dt = new Date(dateto);
          const DateTo = `${dt.getDate().toString().padStart(2, "0")}-${(
            dt.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}-${dt.getFullYear()}`;

          await sendAcceptRejctTimeEntryRequest(
            usreData.firstname,
            DateFrom,
            DateTo,
            "Accepted",
            reportingData.firstname,
            usreData.company_email,
            link
          );
          res.json("Request approved");
        } else {
          res.status(403).json({ status: false, errors: "Permission denied" });
        }
      });
  } catch (e) {
    res.status(400).send(e);
  }
};
apicontroller.rejectTimeEntryRequest = async (req, res) => {
  try {
    const _id = req.params.id;
    const rejectRequestData = {
      status: "2",
      approver_id: req.user._id,
    };
    const timeEntryRejected = await timeEntryRequest.findByIdAndUpdate(
      _id,
      rejectRequestData
    );

    var link = `${process.env.BASE_URL}/employeeLeavesList/`;
    const usreData = await user.findById(timeEntryRejected.user_id);
    var reportingData = await user.findById(req.user._id);
    var datefrom = timeEntryRejected.start_date;
    var dateto = timeEntryRejected.end_date;
    var status = timeEntryRejected.status;
    const df = new Date(datefrom);
    const DateFrom = `${df.getDate().toString().padStart(2, "0")}-${(
      df.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${df.getFullYear()}`;

    const dt = new Date(dateto);
    const DateTo = `${dt.getDate().toString().padStart(2, "0")}-${(
      dt.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dt.getFullYear()}`;

    await sendAcceptRejctTimeEntryRequest(
      usreData.firstname,
      DateFrom,
      DateTo,
      "Rejected",
      reportingData.firstname,
      usreData.company_email,
      link
    );

    res.json("Request approved");
  } catch (e) {
    res.status(400).send(e);
  }
};

apicontroller.filterallUserLeaves = async (req, res) => {
  try {
    var searchData = await leaveHistory.aggregate([
      {
        $match: {
          deleted_at: "null",
          year: req.body.year,
        },
      },
      {
        $lookup: {
          from: "users", // Assuming the name of the user collection is "users"
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          $or: [
            {
              "user.firstname": { $regex: req.body.searchValue, $options: "i" },
            },
            {
              "user.last_name": { $regex: req.body.searchValue, $options: "i" },
            },
          ],
        },
      },
      {
        $project: {
          "user.firstname": 1,
          "user.last_name": 1,
          total_leaves: "$total_leaves", // Assuming these fields exist in your leaveHistory collection
          taken_leaves: "$taken_leaves",
          unpaid_leaves: 1,
          year: "$year",
          remaining_leaves: "$remaining_leaves", // Adjust this based on your actual structure
        },
      },
    ]);
    res.json({ searchData });
  } catch (e) {
    res.status(400).send(e);
  }
};

// apicontroller.approveTimeEntryRequest = async (req, res) => {
//   try {
//     const _id = req.params.id;
//     const approveRequestData = {
//       status: "1",
//       approver_id: req.user._id,
//     };
//     const timeEntryApproved = await timeEntryRequest.findByIdAndUpdate(
//       _id,
//       approveRequestData
//     );

//     var link = `${process.env.BASE_URL}/employeeLeavesList/`;
//     const usreData = await user.findById(timeEntryApproved.user_id);
//     var reportingData = await user.findById(req.user._id);
//     var datefrom = timeEntryApproved.start_date;
//     var dateto = timeEntryApproved.end_date;
//     var status = timeEntryApproved.status;
//     const df = new Date(datefrom);
//     const DateFrom = `${df.getDate().toString().padStart(2, "0")}-${(
//       df.getMonth() + 1
//     )
//       .toString()
//       .padStart(2, "0")}-${df.getFullYear()}`;

//     const dt = new Date(dateto);
//     const DateTo = `${dt.getDate().toString().padStart(2, "0")}-${(
//       dt.getMonth() + 1
//     )
//       .toString()
//       .padStart(2, "0")}-${dt.getFullYear()}`;

//       await sendAcceptRejctTimeEntryRequest(
//         usreData.firstname,
//         DateFrom,
//         DateTo,
//         "Accepted",
//         reportingData.firstname,
//         usreData.company_email,
//         link
//       );

//     res.json("Request approved");
//   } catch (e) {
//     res.status(400).send(e);
//   }
// };

//Create activity Log module

apicontroller.activityLog = async (req, res) => {
  const userData = await user.aggregate([
    { $match: { _id: req.user._id, deleted_at: "null" } },
    {
      $lookup: {
        from: "roles",
        localField: "role_id",
        foreignField: "_id",
        as: "roleData",
      },
    },
    {
      $project: {
        "roleData.role_name": 1,
        "roleData._id": 1,
        firstname: 1,
        last_name: 1,
        photo: 1,
        company_email: 1,
        mo_number: 1,
        status: 1,
        doj: 1,
        emp_code: 1,
        _id: 1,
      },
    },
  ]);
  try {
    if (userData[0].roleData[0].role_name === "Admin") {
      let response = await activity.find();
      for (let i = 0; i < response.length; i++) {
        if (
          response[i].message.startsWith(
            `${userData[0].firstname} ${userData[0].last_name}`
          ) &&
          (response[i].message.includes("himself") ||
            response[i].message.includes("herself"))
        ) {
          response[i].message = response[i].message.replace(
            /himself|herself/g,
            "yourself"
          );
        } else if (response[i].title === "project") {
          response[i].ref_id = response[i].ref_id.filter(
            (item) => item.toString() !== req.user._id.toString()
          );
          const refUserData = await user
            .find({ _id: response[i].ref_id })
            .select("firstname last_name");
          refUserData.map(async (value) => {
            response[i].message = response[i].message.replace(
              `@USERNAME@`,
              `${value.firstname} ${value.last_name}`
            );
          });
        }
      }
      return res.status(200).json({ logData: response });
    } else {
      let response = await activity.find({
        $or: [{ user_id: req.user._id }, { ref_id: req.user._id }],
      });
      for (let i = 0; i < response.length; i++) {
        let lastIndex = response[i].message.lastIndexOf(
          `${userData[0].firstname} ${userData[0].last_name}`
        );
        if (response[i].message.includes(req.user.firstname + "'s")) {
          response[i].message = response[i].message.replace(
            req.user.firstname + "'s",
            "your"
          );
        } else if (
          response[i].message.startsWith(
            `${userData[0].firstname} ${userData[0].last_name}`
          ) &&
          response[i].message.endsWith(
            `${userData[0].firstname} ${userData[0].last_name}`
          )
        ) {
          response[i].message =
            response[i].message.slice(0, lastIndex) +
            "yourself" +
            response[i].message.slice(
              lastIndex +
              `${userData[0].firstname} ${userData[0].last_name}`.length
            );
        } else if (
          response[i].message.includes("himself") ||
          response[i].message.includes("herself")
        ) {
          response[i].message = response[i].message.replace(
            /himself|herself/g,
            "yourself"
          );
        } else if (
          !response[i].message.startsWith(
            `${userData[0].firstname} ${userData[0].last_name}`
          ) &&
          response[i].message.endsWith(
            `${userData[0].firstname} ${userData[0].last_name}`
          )
        ) {
        } else if (response[i].title === "project") {
          response[i].ref_id = response[i].ref_id.filter(
            (item) => item.toString() !== req.user._id.toString()
          );
          const refUserData = await user
            .find({ _id: response[i].ref_id })
            .select("firstname last_name");
          refUserData.map(async (value) => {
            response[i].message = response[i].message.replace(
              `@USERNAME@`,
              "you"
            );
          });
        }
      }
      return res.status(200).json({ logData: response });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};
//Delete Logs
apicontroller.activityLogDelete = async (req, res) => {
  try {
    let id = req.body.id;
    await activity.findByIdAndDelete(id);
    return res.status(200).json({ logData: "Deleted", status: true });
  } catch (error) {
    return res.status(403).json({ status: false, errors: "Permission denied" });
  }
};
//functions for compare 2 arrays
function addedPermission(arr1, arr2) {
  const uniqueIds = arr1.filter((id) => !arr2.includes(id));
  return uniqueIds;
}
function removedPermission(arr1, arr2) {
  const uniqueIds = arr2.filter((id) => !arr1.includes(id));
  return uniqueIds;
}

apicontroller.punch_in = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const dateString =
          new Date().toISOString().split("T")[0] + "T00:00:00.000+00:00";

        const allreadypunch = await workingHour.find({
          user_id: user_id,
          end_time: null,
          date: dateString,
        });

        if (allreadypunch.length !== 0) {
          res.json("you are already punched-in");
        } else {
          axios
            .get("http://worldtimeapi.org/api/timezone/Asia/Kolkata")
            .then((response) => {
              const currentIndianTime = new Date(response.data.datetime);
              const currentDate =
                currentIndianTime.toISOString().split("T")[0] +
                "T00:00:00.000+00:00";
              const currentTime = currentIndianTime.toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }
              );
              const Punch_in_data = new workingHour({
                user_id: user_id,
                date: currentDate,
                start_time: currentTime,
                end_time: null,
                total_hour: "00:00",
              });

              Punch_in_data.save()
                .then((addpunch) => {
                  res.status(201).json(addpunch);
                })
                .catch((error) => {
                  console.error("Error:", error);
                  res.status(500).json({ error: "Failed to save punch data" });
                });
            })
            .catch((error) => {
              console.error("Error:", error);
              res.status(500).json({ error: "Failed to fetch current time" });
            });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.punch_out = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const check_punch_out = await workingHour.findOne({ end_time: null });
        if (check_punch_out === null) {
          res.json("you are already punched-out");
        } else {
          axios
            .get("http://worldtimeapi.org/api/timezone/Asia/Kolkata")
            .then(async (response) => {
              const currentIndianTime = new Date(response.data.datetime);
              const currentDate =
                currentIndianTime.toISOString().split("T")[0] +
                "T00:00:00.000+00:00";
              const currentTime = currentIndianTime.toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }
              );
              const punch_id = req.params.id;
              const punch_data_old = await workingHour.findOne({
                _id: punch_id,
              });
              const oldtime = punch_data_old.start_time;
              const newtime = new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              const oldDate = new Date(`01/01/2000 ${oldtime}`);
              const newDate = new Date(`01/01/2000 ${newtime}`);
              const diffMs = newDate - oldDate;

              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMinutes = Math.floor(
                (diffMs % (1000 * 60 * 60)) / (1000 * 60)
              );

              const formattedHours = String(diffHours).padStart(2, "0");
              const formattedMinutes = String(diffMinutes).padStart(2, "0");

              const duration = `${formattedHours}:${formattedMinutes}`;
              const options = { timeZone: "Asia/Kolkata", hour12: false };

              const Punch_out_data = {
                user_id: user_id,
                end_time: currentTime,
                total_hour: duration,
              };

              workingHour
                .findOneAndUpdate(
                  { _id: punch_id },
                  { $set: Punch_out_data },
                  { new: true }
                )
                .then((punch) => {
                  res.status(200).json(punch);
                });
            })
            .catch((error) => {
              res.status(500).json({ error: error });
            });
        }
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.punch_data = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const punch_data = await workingHour.find({ user_id: user_id });
        const alldata = await workingHour.find();
        res.status(201).json(alldata);
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};

apicontroller.check_punch = async (req, res) => {
  sess = req.session;
  const user_id = req.user._id;
  const role_id = req.user.role_id.toString();
  helper
    .checkPermission(role_id, user_id, "Add TimeEntry")
    .then(async (rolePerm) => {
      if (rolePerm.status == true) {
        const dateString =
          new Date().toISOString().split("T")[0] + "T00:00:00.000+00:00";

        const allreadypunch = await workingHour.find({
          user_id: user_id,
          end_time: null,
          date: dateString,
        });

        res.status(201).json(allreadypunch);
      } else {
        res.status(403).json({ status: false, errors: "Permission denied" });
      }
    })
    .catch((error) => {
      res.status(403).send(error);
    });
};
apicontroller.addLeaveHistoryData = async (req, res) => {
  try {
    const endMonth = moment().month() + 1 < 4;
    const currentYear = endMonth
      ? moment().subtract(1, "year").year()
      : moment().year();
    const previousYear = `${currentYear - 1}-${currentYear}`;
    const thisyear = `${currentYear}-${currentYear + 1}`;
    const nextyear = `${currentYear + 1}-${currentYear + 2}`;
    const PreviuosYearLeavesHistoryData = await leaveHistory.find({
      deleted_at: "null",
      year: thisyear,
    });
    const leavesSettingData = await Settings.findOne({ key: "leaves" });
    let totalLeaves = parseInt(leavesSettingData.value);
    PreviuosYearLeavesHistoryData.forEach((leave) => {
      const leaveHistoryData = new leaveHistory({
        user_id: leave.user_id,
        year: nextyear,
        total_leaves: totalLeaves,
        taken_leaves: 0,
        remaining_leaves: totalLeaves,
      });
      leaveHistoryData.save();
    });
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
  // });
};
apicontroller.updateLeaveHistoryData = async (req, res) => {
  try {
    console.log("donnee");
    const endMonth = moment().month() + 1 < 4;
    const currentYear = endMonth
      ? moment().subtract(1, "year").year()
      : moment().year();
    const previousYear = `${currentYear - 1}-${currentYear}`;
    const thisYear = `${currentYear}-${currentYear + 1}`;
    console.log("thisYear", thisYear);
    const carryOverLeavesData = await Settings.findOne({
      key: "carry-over-leaves",
    });
    let carryOverLeaves = carryOverLeavesData ? carryOverLeavesData.value : 9;

    leaveHistory.find({ year: previousYear }).then(async (previousYearData) => {
      // console.log("previousYearData", previousYearData);
      for (const previousYearDoc of previousYearData) {
        await leaveHistory.findOneAndUpdate(
          {
            user_id: previousYearDoc.user_id,
            year: thisYear,
          },
          {
            $inc: {
              total_leaves: Math.max(
                0,
                Math.min(carryOverLeaves, previousYearDoc.remaining_leaves)
              ),
              remaining_leaves: Math.max(
                0,
                Math.min(carryOverLeaves, previousYearDoc.remaining_leaves)
              ),
            },
          }
        );
      }
    });
    res.status(200).json({ message: "Leave history updated successfully" });
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
};

apicontroller.addExistingUserLeaveHistory = async (req, res) => {
  try {
    const endMonth = moment().month() + 1 < 4;
    const currentYear = endMonth
      ? moment().subtract(1, "year").year()
      : moment().year();
    const nextYear = currentYear + 1;

    const startDateRange = moment({ year: currentYear, month: 3, day: 1 }); // April 1st of the current year
    const endDateRange = moment({ year: nextYear, month: 2, day: 31 });

    console.log(
      "startDateRange",
      startDateRange.toDate(),
      "end",
      endDateRange.toDate()
    );
    const userData = await user.find({ deleted_at: "null" }).select("_id doj");
    const leavesSettingData = await Settings.find({ key: "leaves" });
    userData.forEach(async (user) => {
      const doj = user.doj;
      const dojYear = doj.getFullYear();
      const dojMonth = doj.getMonth() + 1; // Adding 1 because months are zero-based
      let workingMonths;
      let totalLeaves = parseInt(leavesSettingData[0].value);
      let academicYear;
      if (dojMonth >= 4) {
        workingMonths = 12 - (dojMonth - 4); // Corrected subtraction
        console.log("workingMonths", workingMonths);
        academicYear = `${dojYear}-${dojYear + 1}`;
      } else {
        workingMonths = 4 - dojMonth;
        academicYear = `${dojYear - 1}-${dojYear}`;
      }
      console.log("workingMonths", workingMonths, dojMonth);
      if (academicYear == "2023-2024") {
        totalLeaves = Math.floor((totalLeaves / 12) * workingMonths);
        const takenLeaves = await leaves
          .find({
            user_id: user._id,
            deleted_at: "null",
            status: "APPROVED",
            datefrom: {
              $gte: startDateRange.toDate(),
              $lte: endDateRange.toDate(),
            },
          })
          .select("total_days");
        let totaldays = 0;
        takenLeaves.forEach((leaves) => {
          totaldays += parseFloat(leaves.total_days);
        });
        const remainingLeaves = totalLeaves - totaldays;
        console.log(remainingLeaves, " ::remainingLeaves");

        const payload = new leaveHistory({
          user_id: user._id,
          year: academicYear,
          total_leaves: totalLeaves,
          taken_leaves: totaldays,
          remaining_leaves: remainingLeaves,
        });
        const userLeavesData = payload.save();
      } else {
        const takenLeaves = await leaves
          .find({
            user_id: user._id,
            deleted_at: "null",
            status: "APPROVED",
            datefrom: {
              $gt: startDateRange.toDate(),
              $lte: endDateRange.toDate(),
            },
          })
          .select("total_days");
        let totaldays = 0;
        takenLeaves.forEach((leaves) => {
          totaldays += parseFloat(leaves.total_days);
        });
        const remainingLeaves = totalLeaves - totaldays;
        const payload = new leaveHistory({
          user_id: user._id,
          year: "2023-2024",
          total_leaves: totalLeaves,
          taken_leaves: totaldays,
          remaining_leaves: remainingLeaves,
        });
        const userLeavesData = payload.save();
      }
    });
    res.json({ message: "Leave history added successfully" });
  } catch (error) {
    console.error("Error fetching users list:", error.message);
    res.status(500).json({ error: error.message });
  }
};

apicontroller.updateCreatedAt = async (req, res) => {
  try {
    const documentsToUpdate = await task.find({
      created_at: { $type: "string" },
      deleted_at: "null",
    });

    // Update each document by converting created_at to a Date object
    const bulkOps = documentsToUpdate.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: { created_at: new Date(doc.created_at) },
        },
      },
    }));
    const result = await task.bulkWrite(bulkOps);
    res.json({ message: "successfully" });
    // const taskData = await task.find()
    // await leaveHistory.deleteMany();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
apicontroller.addLeaveNewData = async (req, res) => {
  try {
    const leavesToUpdate = await leaves.find({ deleted_at: "null" });

    for (const leave of leavesToUpdate) {
      const totalDays = parseInt(leave.total_days);
      await leaves.updateOne(
        { _id: leave._id },
        {
          $set: {
            paid_status: "PAID",
            unpaid_leaves: 0,
            paid_leaves: totalDays,
          },
        }
      );
    }

    console.log(`${leavesToUpdate.length} documents updated successfully`);
    res.status(200).json({ message: "Leaves updated successfully" });
  } catch (error) {
    console.error("Error updating documents:", error);
    res.status(500).json({ error: error.message });
  }
};
apicontroller.addLeaveHistoryNewData = async (req, res) => {
  try {
    await leaveHistory.updateMany(
      { deleted_at: "null" }, // Filter to match all documents
      {
        $set: {
          unpaid_leaves: 0,
        },
      },
      function (err, result) {
        if (err) {
          console.error("Error updating documents:", err);
        } else {
          console.log(`${result.modifiedCount} documents updated successfully`);
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// apicontroller.deleteLeaveHistory = async (req, res) => {
//   try {
//     await leaveHistory.deleteMany();
//     res.json({ message: "Leave history deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

apicontroller.editLeaveHistory = async (req, res) => {
  try {
    const id = req.params.id;
    const leaveHistoryData = await leaveHistory
      .findOne({ _id: id })
      .populate("user_id", "firstname last_name");
    console.log(leaveHistoryData, "leaveHistoryData");
    res.json({ leaveHistory: leaveHistoryData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
apicontroller.updateLeaveHistory = async (req, res) => {
  try {
    const _id = req.params.id;
    const updateleaveHistory = {
      total_leaves: req.body.total_leaves,
      taken_leaves: req.body.taken_leaves,
      remaining_leaves: req.body.remaining_leaves,
    };
    const updateleaveHistorydata = await leaveHistory.findByIdAndUpdate(
      _id,
      updateleaveHistory
    );
    res.status(201).json({
      message: "Leave History Updated successfully",
      updateleaveHistorydata,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
apicontroller.deleteLeaveHistory = async (req, res) => {
  try {
    const _id = req.params.id;
    await leaveHistory.findByIdAndDelete(_id);

    res.status(201).json({
      message: "Leave History Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
apicontroller.sendmail = async (req, res) => {
  await sendUserEmail(
    "aman.shah@codecrewinfotech.com",
    "65d33b3401868cb287a2ab93",
    "abc",
    "abc"
  );
  res.status(200).json("sednd");
};

apicontroller.getTimeEntryDataByProject = async (req, res) => {
  try {
    const projectId = new BSON.ObjectId(req.query.project_id);
    const _month = req.query.month;
    const _year = req.query.year;
    const userMatch = req.query.user_id
      ? [{ $match: { user_id: new BSON.ObjectId(req.query.user_id) } }]
      : [];
    const projectMatch = req.query.project_id
      ? [{ $match: { project_id: new BSON.ObjectId(req.query.project_id) } }]
      : [];
    const projectTimeEntryData = await timeEntry.aggregate([
      { $match: { deleted_at: "null" } },
      ...projectMatch,
      ...userMatch,
      // {
      //   $match: {
      //     $expr: {
      //       $and: [
      //         {
      //           $cond: {
      //             if: { $ne: [_month, ''] }, // Check if _month is not empty
      //             then: {
      //               $eq: [
      //                 { $month: "$date" },
      //                 parseInt(_month),
      //               ],
      //             },
      //             else: true, // If _month is empty, skip this condition
      //           },
      //         },
      //         {
      //           $cond: {
      //             if: { $ne: [_year, ''] }, // Check if _year is not empty
      //             then: {
      //               $eq: [
      //                 { $year: "$date" },
      //                 parseInt(_year),
      //               ],
      //             },
      //             else: true, // If _year is empty, skip this condition
      //           },
      //         },
      //       ],
      //     },
      //   },
      // },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: "$project",
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task_id",
          foreignField: "_id",
          as: "taskData",
        },
      },
      {
        $unwind: "$taskData",
      },
      {
        $addFields: {
          estimatedHoursInt: { $toInt: "$taskData.task_estimation" },
          taskCreatedMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: new Date("$taskData.created_at"),
            },
          },
        },
      },
      {
        $group: {
          _id: {
            user_id: "$user._id",
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$date",
              },
            },
            taskCreatedMonth: "$taskCreatedMonth",
          },
          totalHoursUser: { $sum: "$hoursInt" },
          totalHoursMonth: { $sum: "$hoursInt" },
          estimatedHoursMonth: { $sum: "$estimatedHoursInt" },
          firstName: { $first: "$user.firstname" },
          projectTitle: { $first: "$project.title" },
        },
      },
      {
        $group: {
          _id: {
            month: "$_id.month",
            taskCreatedMonth: "$_id.taskCreatedMonth",
          },
          totalHoursMonth: { $sum: "$totalHoursMonth" },
          estimatedHoursMonth: { $sum: "$estimatedHoursMonth" },
          users: {
            $push: {
              user_id: "$_id.user_id",
              firstname: "$firstName",
              totalHoursUser: "$totalHoursUser",
              estimatedHoursUser: "$estimatedHoursInt",
            },
          },
          project: { $first: "$projectTitle" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          taskCreatedMonth: "$_id.taskCreatedMonth",
          totalHoursMonth: 1,
          estimatedHoursMonth: 1,
          users: 1,
          project: 1,
        },
      },
      {
        $sort: {
          month: -1,
        },
      },
    ]);
    console.log("projectTimeEntryData", projectTimeEntryData);

    const allProjectData = await project
      .find({ deleted_at: "null" })
      .select("title");
    const projectData = await project
      .findOne({ deleted_at: "null", _id: projectId })
      .select("title");
    const userData = await user
      .find({ deleted_at: "null" })
      .select("firstname last_name");
    res.json({ projectTimeEntryData, projectData, userData, allProjectData });
  } catch (e) {
    res.status(400).send(e);
  }
};

(module.exports = apicontroller), { logUserIdentity, logFormat };
