import 'react'
import NavBar from "./navBar.jsx";
import ProfileImage from "./utils/ProfileImage.jsx";
import {useAuth} from "../Auth/AuthContext.jsx";

const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={[]} />
            <div className="flex flex-col items-center justify-center">
                <div className="card w-full h-fit max-w-190 mb-2">
                    <div className="card-body bg-base-300 rounded-xl flex flex-row items-center gap-4">
                        <ProfileImage size="24" type="circle"/>
                        <div className="flex flex-col gap-3">
                            <button className="btn btn-outline btn-primary w-fit rounded-lg">Upload New</button>
                            <div className="text-sm">
                                {user.email}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card w-full max-w-190 mb-2">
                    <div className="card-body bg-base-300 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white col-span-1 md:col-span-2">Personal Information</h3>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">First Name</legend>
                            <input type="text" className="input w-full p-3 rounded text-white" placeholder="First Name"/>
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Last Name</legend>
                            <input type="text" className="input w-full p-3 rounded text-white" placeholder="Last Name"/>
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Email</legend>
                            <input type="text" className="input w-full p-3 rounded text-white" placeholder="mail@example.com"/>
                        </fieldset>

                        <div className="col-span-1 md:col-span-2 mt-4">
                            <button className="btn btn-primary rounded-lg px-4">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
                <div className="card w-full max-w-190 mb-2">
                    <div className="card-body bg-base-300 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white">Change Password</h3>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Current Password</legend>
                            <input type="text" className="input w-full p-3 rounded text-white"/>
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">New Password</legend>
                            <input type="text" className="input w-full p-3 rounded text-white"/>
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Confirm New Password</legend>
                            <input type="text" className="input w-full p-3 rounded text-white"/>
                        </fieldset>
                        <button className="btn btn-primary rounded-lg px-4 w-fit">Update Password</button>
                    </div>
                </div>
                <div className="card w-full max-w-190">
                    <div className="card-body flex flex-row items-center justify-between bg-base-300 p-6 rounded-lg">
                        <div className="flex flex-col justify-center w-fit">
                            <h3 className="text-xl font-bold text-warning">Delete Account</h3>
                            <p>Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <button className="btn btn-error w-fit">Delete Account</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ProfilePage
